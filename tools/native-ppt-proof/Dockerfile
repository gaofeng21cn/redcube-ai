FROM node:24-bookworm

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      libreoffice \
      poppler-utils \
      fonts-noto-cjk \
      curl \
      python3 \
      python3-pip \
      python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.100/SHA256SUMS -o /tmp/officecli-SHA256SUMS \
    && curl -fsSL https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.100/officecli-linux-x64 -o /usr/local/bin/officecli \
    && grep '  officecli-linux-x64$' /tmp/officecli-SHA256SUMS | sed 's#officecli-linux-x64#/usr/local/bin/officecli#' | sha256sum -c - \
    && chmod +x /usr/local/bin/officecli \
    && rm -f /tmp/officecli-SHA256SUMS

COPY .github/requirements/ci-python.txt /tmp/redcube-ci-python.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /tmp/redcube-ci-python.txt \
    && python3 -m playwright install --with-deps chromium

CMD ["python3", "-m", "redcube_ai.native_helpers.doctor"]
