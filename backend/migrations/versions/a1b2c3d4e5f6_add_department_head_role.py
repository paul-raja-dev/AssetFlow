"""add DEPARTMENT_HEAD to users role check constraint

Revision ID: a1b2c3d4e5f6
Revises: 896da25a77c2
Create Date: 2026-07-12
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '896da25a77c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('ck_users_role', 'users', type_='check')
    op.create_check_constraint(
        'ck_users_role',
        'users',
        "role IN ('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE')",
    )


def downgrade() -> None:
    op.drop_constraint('ck_users_role', 'users', type_='check')
    op.create_check_constraint(
        'ck_users_role',
        'users',
        "role IN ('ADMIN', 'ASSET_MANAGER', 'EMPLOYEE')",
    )
