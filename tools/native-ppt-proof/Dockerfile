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

RUN release_url="$(curl -fsSL --connect-timeout 10 --max-time 60 -o /dev/null -w '%{url_effective}' https://github.com/iOfficeAI/OfficeCLI/releases/latest)" \
    && version="${release_url##*/}" \
    && printf '%s\n' "$version" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    && curl -fsSL "https://github.com/iOfficeAI/OfficeCLI/releases/download/$version/SHA256SUMS" -o /tmp/officecli-SHA256SUMS \
    && curl -fsSL "https://github.com/iOfficeAI/OfficeCLI/releases/download/$version/officecli-linux-x64" -o /usr/local/bin/officecli \
    && grep '  officecli-linux-x64$' /tmp/officecli-SHA256SUMS | sed 's#officecli-linux-x64#/usr/local/bin/officecli#' | sha256sum -c - \
    && chmod +x /usr/local/bin/officecli \
    && officecli create /tmp/officecli-probe.pptx \
    && officecli close /tmp/officecli-probe.pptx \
    && test -s /tmp/officecli-probe.pptx \
    && rm -f /tmp/officecli-SHA256SUMS /tmp/officecli-probe.pptx

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
