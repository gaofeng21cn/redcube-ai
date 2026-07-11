FROM ghcr.io/astral-sh/uv:0.9.5 AS uv
FROM node:24-bookworm

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

COPY --from=uv /uv /uvx /bin/

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      libreoffice \
      poppler-utils \
      fonts-noto-cjk \
      curl \
      python3 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.100/SHA256SUMS -o /tmp/officecli-SHA256SUMS \
    && curl -fsSL https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.100/officecli-linux-x64 -o /usr/local/bin/officecli \
    && grep '  officecli-linux-x64$' /tmp/officecli-SHA256SUMS | sed 's#officecli-linux-x64#/usr/local/bin/officecli#' | sha256sum -c - \
    && chmod +x /usr/local/bin/officecli \
    && rm -f /tmp/officecli-SHA256SUMS

ENV UV_PROJECT_ENVIRONMENT=/opt/redcube-venv \
    UV_CACHE_DIR=/tmp/uv-cache \
    UV_LINK_MODE=copy \
    PYTHONPATH=/workspace/python \
    PYTHONDONTWRITEBYTECODE=1 \
    REDCUBE_NATIVE_PPT_PROOF_PYTHON=/opt/redcube-venv/bin/python \
    PATH="/opt/redcube-venv/bin:${PATH}"

COPY pyproject.toml uv.lock ./
COPY python ./python
RUN uv sync --locked --no-dev --extra native --no-install-project --python /usr/bin/python3 \
    && python -m playwright install --with-deps chromium \
    && rm -rf "$UV_CACHE_DIR"

CMD ["python", "-m", "redcube_ai.native_helpers.doctor"]
