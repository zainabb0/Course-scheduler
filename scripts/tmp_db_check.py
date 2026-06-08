import asyncio
from sqlalchemy import select
from app.database import engine
from app.models.schedule import Schedule
from app.models.schedule_entry import ScheduleEntry

async def main():
    async with engine.connect() as conn:
        s = await conn.execute(select(Schedule.id, Schedule.status).order_by(Schedule.created_at.desc()).limit(5))
        print('schedules:', s.all())
        e = await conn.execute(select(ScheduleEntry.schedule_id).limit(5))
        print('entries examples:', e.all())
        c = await conn.execute(select(ScheduleEntry.schedule_id))
        rows = c.all()
        print('entries count:', len(rows))

if __name__ == '__main__':
    asyncio.run(main())
