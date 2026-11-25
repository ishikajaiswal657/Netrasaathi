"""stage a stage b explanations

Revision ID: b7e4113e6a92
Revises: a60432a8a139
Create Date: 2026-11-22 21:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e4113e6a92'
down_revision: Union[str, Sequence[str], None] = 'a60432a8a139'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add stage_a_json to pages
    with op.batch_alter_table('pages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stage_a_json', sa.Text(), nullable=True))

    # Add one_line_summary to blocks
    with op.batch_alter_table('blocks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('one_line_summary', sa.String(length=500), nullable=True))

    # Create page_explanations table if not already created
    op.create_table(
        'page_explanations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('page_id', sa.Integer(), sa.ForeignKey('pages.id', ondelete='CASCADE'), nullable=False),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('detail_level', sa.String(length=20), nullable=False, server_default='detailed'),
        sa.Column('one_line_summary', sa.String(length=500), nullable=True),
        sa.Column('page_topic', sa.String(length=255), nullable=True),
        sa.Column('blocks_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_page_explanations_page_id', 'page_explanations', ['page_id'])
    op.create_index('ix_page_explanations_language', 'page_explanations', ['language'])
    op.create_index('ix_page_explanations_detail_level', 'page_explanations', ['detail_level'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_page_explanations_detail_level', table_name='page_explanations')
    op.drop_index('ix_page_explanations_language', table_name='page_explanations')
    op.drop_index('ix_page_explanations_page_id', table_name='page_explanations')
    op.drop_table('page_explanations')
    with op.batch_alter_table('blocks', schema=None) as batch_op:
        batch_op.drop_column('one_line_summary')
    with op.batch_alter_table('pages', schema=None) as batch_op:
        batch_op.drop_column('stage_a_json')
