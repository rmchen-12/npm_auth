FROM node:10.0-alpine
RUN mkdir -p /home/project
WORKDIR /home/project 
COPY package.json /home/project/package.json
RUN npm i --registry=https://registry.npm.taobao.org
COPY . /home/project
EXPOSE 7001
CMD npm start