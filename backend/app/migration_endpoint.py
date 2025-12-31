"""
Temporary migration endpoint to add missing columns
This file can be added to main.py temporarily to run the migration
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, text
from app.database.session import get_db
import logging

logger = logging.getLogger(__name__)

migration_router = APIRouter(prefix="/migrate", tags=["migration"])

@migration_router.post("/add-practice-columns")
async def add_practice_columns(db: Session = Depends(get_db)):
    """Add missing columns to practicequestion table"""
    try:
        # Check if table exists
        result = db.exec(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'practicequestion'
            );
        """))
        
        table_exists = result.first()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail="practicequestion table not found")
        
        # Check current columns
        result = db.exec(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'practicequestion'
            ORDER BY ordinal_position;
        """))
        
        existing_columns = [row for row in result.fetchall()]
        logger.info(f"Existing columns: {existing_columns}")
        
        # Migration queries
        migrations = [
            "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS model_used VARCHAR;",
            "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS generation_prompt TEXT;",
            "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
        ]
        
        results = []
        
        for migration in migrations:
            try:
                logger.info(f"Running: {migration}")
                db.exec(text(migration))
                db.commit()
                results.append({"query": migration, "status": "success"})
                logger.info("✅ Success")
            except Exception as e:
                logger.warning(f"Migration warning: {e}")
                results.append({"query": migration, "status": "warning", "error": str(e)})
        
        # Update existing records with timestamps
        try:
            result = db.exec(text("""
                UPDATE practicequestion 
                SET 
                    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
                WHERE id IS NOT NULL;
            """))
            db.commit()
            updated_count = result.rowcount
            logger.info(f"Updated {updated_count} existing records")
        except Exception as e:
            logger.warning(f"Update existing records warning: {e}")
            updated_count = 0
        
        # Get final structure
        result = db.exec(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'practicequestion'
            ORDER BY ordinal_position;
        """))
        
        final_columns = []
        for row in result.fetchall():
            final_columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2],
                "default": row[3]
            })
        
        return {
            "message": "Migration completed successfully",
            "migration_results": results,
            "updated_records": updated_count,
            "final_table_structure": final_columns
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

@migration_router.get("/check-practice-table")
async def check_practice_table(db: Session = Depends(get_db)):
    """Check the current structure of the practicequestion table"""
    try:
        # Check if table exists
        result = db.exec(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'practicequestion'
            );
        """))
        
        table_exists = result.first()
        
        if not table_exists:
            return {"table_exists": False, "message": "practicequestion table not found"}
        
        # Get table structure
        result = db.exec(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'practicequestion'
            ORDER BY ordinal_position;
        """))
        
        columns = []
        for row in result.fetchall():
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2],
                "default": row[3]
            })
        
        # Check for required columns
        required_columns = ["model_used", "generation_prompt", "created_at", "updated_at"]
        existing_column_names = [col["name"] for col in columns]
        missing_columns = [col for col in required_columns if col not in existing_column_names]
        
        return {
            "table_exists": True,
            "columns": columns,
            "missing_columns": missing_columns,
            "migration_needed": len(missing_columns) > 0
        }
        
    except Exception as e:
        logger.error(f"Check table failed: {e}")
        raise HTTPException(status_code=500, detail=f"Check table failed: {str(e)}")