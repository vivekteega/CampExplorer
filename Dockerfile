FROM node:7.5.0

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

COPY package.json npm-shrinkwrap.json $HOME/tagsearch/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/tagsearch
RUN npm install

USER root
COPY . $HOME/tagsearch
RUN chown -R app:app $HOME/*
USER app