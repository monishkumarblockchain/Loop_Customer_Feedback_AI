# LOOP Backend

AI Customer Feedback Intelligence Platform built with Django REST Framework, PostgreSQL, Redis, Celery and Django Channels.

## Roles
- ADMIN: platform administration
- OWNER: company management
- ANALYST: feedback/analytics access
- VIEWER: feedback and comments

## Quick start

### Local
1. Create PostgreSQL database `loop`.
2. Copy `.env.example` to `.env`.
3. Create a virtual environment.
4. Install requirements.
5. Run migrations.
6. Create a superuser.
7. Start Django and Redis/Celery for background AI processing.

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Redis is required for Celery/Channels in the default configuration.

### Docker
```bash
docker compose up --build
```

API root:
`/api/v1/`

Swagger:
`/api/docs/`

Django admin:
`/admin/`

WebSocket:
`ws://localhost:8000/ws/notifications/<company_id>/`

## Main API endpoints

Authentication:
- POST `/api/v1/auth/register/`
- POST `/api/v1/auth/login/`
- POST `/api/v1/auth/refresh/`
- GET `/api/v1/auth/me/`

Companies:
- GET/POST `/api/v1/companies/`
- GET/PUT/PATCH/DELETE `/api/v1/companies/{id}/`

Products:
- GET/POST `/api/v1/products/`
- GET/PUT/PATCH/DELETE `/api/v1/products/{id}/`

Feedback:
- GET/POST `/api/v1/feedback/`
- GET/PUT/PATCH/DELETE `/api/v1/feedback/{id}/`
- GET `/api/v1/feedback/{id}/comments/`
- POST `/api/v1/feedback/{id}/comments/`

Analytics:
- GET `/api/v1/analytics/overview/`
- GET `/api/v1/analytics/sentiment/`
- GET `/api/v1/analytics/top-issues/`
- GET `/api/v1/analytics/feature-requests/`
- GET `/api/v1/analytics/ai-summary/`

Reports:
- GET `/api/v1/reports/feedback.csv`

AI analysis runs through Celery after feedback creation/update. If the transformer model is unavailable, a lightweight keyword fallback is used.
