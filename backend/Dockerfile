FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements-prod.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements-prod.txt

COPY . .

USER app

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port \"$PORT\""]
