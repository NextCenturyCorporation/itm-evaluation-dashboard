FROM amazonlinux:2

RUN yum update -y && \
    yum install -y \
      ca-certificates \
      curl \
      git \
      gzip \
      tar \
      which \
      alsa-lib \
      atk \
      at-spi2-atk \
      cups-libs \
      gtk3 \
      libXcomposite \
      libXcursor \
      libXdamage \
      libXext \
      libXi \
      libXrandr \
      libXScrnSaver \
      libXtst \
      pango \
      nss \
      xorg-x11-fonts-Type1 \
      xorg-x11-fonts-misc && \
    yum clean all

# Install Node.js 20.
RUN curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    yum install -y nodejs && \
    yum clean all

WORKDIR /workspace

ENV NODE_ENV=test
ENV MONGOMS_SYSTEM_BINARY=/opt/mongodb/bin/mongod