FROM node:slim
RUN mkdir -p /home/node/service
RUN npm install pm2 -g
WORKDIR /home/node/service
COPY package.json /home/node/service
RUN npm install
COPY . /home/node/service
CMD ["npm", "start"]
# CMD [ "pm2-runtime", "process.yml" ]