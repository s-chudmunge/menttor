from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from core.config import settings


engine = create_engine(
    settings.get_database_url(),
    echo=settings.DATABASE_ECHO,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    )


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session