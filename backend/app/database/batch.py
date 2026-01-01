"""
Database Request Batching and Query Optimization
Reduces database round trips by batching operations
"""

import logging
import asyncio
from typing import List, Dict, Any, Callable, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, namedtuple
from sqlmodel import Session, select
from contextlib import contextmanager
import json

logger = logging.getLogger(__name__)

BatchOperation = namedtuple('BatchOperation', ['table', 'operation', 'data', 'callback'])

class BatchProcessor:
    """Batches database operations to reduce connection usage"""
    
    def __init__(self, batch_size: int = 50, flush_interval: float = 2.0):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._pending_operations: List[BatchOperation] = []
        self._last_flush = datetime.utcnow()
        self._callbacks: Dict[str, List[Callable]] = defaultdict(list)
    
    def add_operation(self, table: str, operation: str, data: Dict[str, Any], 
                     callback: Optional[Callable] = None) -> None:
        """Add operation to batch queue"""
        op = BatchOperation(table, operation, data, callback)
        self._pending_operations.append(op)
        
        logger.debug(f"Added {operation} operation for {table}, queue size: {len(self._pending_operations)}")
        
        # Auto-flush if batch is full or interval exceeded
        if (len(self._pending_operations) >= self.batch_size or 
            datetime.utcnow() - self._last_flush > timedelta(seconds=self.flush_interval)):
            self.flush()
    
    def flush(self, session: Optional[Session] = None) -> None:
        """Execute all pending operations in a single transaction"""
        if not self._pending_operations:
            return
        
        operations_count = len(self._pending_operations)
        logger.info(f"Flushing {operations_count} batched operations")
        
        try:
            if session:
                self._execute_batch(session)
            else:
                from app.database.session import get_db
                with next(get_db()) as db_session:
                    self._execute_batch(db_session)
            
            logger.info(f"Successfully executed {operations_count} batched operations")
            
        except Exception as e:
            logger.error(f"Batch execution failed: {e}")
            raise
        finally:
            self._pending_operations.clear()
            self._last_flush = datetime.utcnow()
    
    def _execute_batch(self, session: Session) -> None:
        """Execute batched operations in a single transaction"""
        # Group operations by type for efficient execution
        grouped_ops = defaultdict(list)
        for op in self._pending_operations:
            grouped_ops[f"{op.table}_{op.operation}"].append(op)
        
        try:
            for operation_type, operations in grouped_ops.items():
                self._execute_operation_group(session, operations)
            
            session.commit()
            
            # Execute callbacks
            for op in self._pending_operations:
                if op.callback:
                    try:
                        op.callback()
                    except Exception as e:
                        logger.error(f"Callback execution failed: {e}")
            
        except Exception as e:
            session.rollback()
            raise
    
    def _execute_operation_group(self, session: Session, operations: List[BatchOperation]) -> None:
        """Execute a group of similar operations efficiently"""
        if not operations:
            return
        
        table = operations[0].table
        operation = operations[0].operation
        
        if operation == 'insert':
            # Bulk insert
            data_list = [op.data for op in operations]
            session.bulk_insert_mappings(self._get_model_class(table), data_list)
            
        elif operation == 'update':
            # Bulk update
            for op in operations:
                session.merge(self._create_model_instance(table, op.data))
                
        elif operation == 'delete':
            # Bulk delete by IDs
            ids = [op.data.get('id') for op in operations if op.data.get('id')]
            if ids:
                model_class = self._get_model_class(table)
                session.query(model_class).filter(model_class.id.in_(ids)).delete()
        
        logger.debug(f"Executed {len(operations)} {operation} operations for {table}")
    
    def _get_model_class(self, table_name: str):
        """Get SQLModel class for table name"""
        from app.sql_models import (
            User, UserBehavior, LearningSession, 
            UserProgress, Roadmap
        )
        
        model_map = {
            'user': User,
            'userbehavior': UserBehavior,
            'learningsession': LearningSession,
            'userprogress': UserProgress,
            'roadmap': Roadmap,

        }
        
        return model_map.get(table_name.lower())
    
    def _create_model_instance(self, table_name: str, data: Dict[str, Any]):
        """Create model instance from data"""
        model_class = self._get_model_class(table_name)
        if model_class:
            return model_class(**data)
        return None

# Global batch processor
batch_processor = BatchProcessor(batch_size=25, flush_interval=1.5)

@contextmanager
def batch_operations(session: Session):
    """Context manager for batching operations within a session"""
    try:
        yield batch_processor
    finally:
        batch_processor.flush(session)

def batch_insert(table: str, data: Dict[str, Any], callback: Optional[Callable] = None):
    """Queue an insert operation for batching"""
    batch_processor.add_operation(table, 'insert', data, callback)

def batch_update(table: str, data: Dict[str, Any], callback: Optional[Callable] = None):
    """Queue an update operation for batching"""
    batch_processor.add_operation(table, 'update', data, callback)

def batch_delete(table: str, data: Dict[str, Any], callback: Optional[Callable] = None):
    """Queue a delete operation for batching"""
    batch_processor.add_operation(table, 'delete', data, callback)

# Query optimization helpers

def optimize_select_query(query, limit: Optional[int] = None, offset: Optional[int] = None):
    """Add pagination and optimization hints to select queries"""
    if limit:
        query = query.limit(limit)
    if offset:
        query = query.offset(offset)
    return query

def bulk_fetch_by_ids(session: Session, model_class, ids: List[Any], batch_size: int = 100):
    """Efficiently fetch multiple records by IDs in batches"""
    results = []
    
    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i:i + batch_size]
        batch_results = session.exec(
            select(model_class).where(model_class.id.in_(batch_ids))
        ).all()
        results.extend(batch_results)
    
    return results