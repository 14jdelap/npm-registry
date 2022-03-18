const getPort = require('get-port');
const got = require('got');
const { createApp } = require('../src/app');

describe('/package/:name/:version endpoint', () => {
  let server;
  let port;

  beforeAll(async (done) => {
    port = await getPort();
    server = createApp().listen(port, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('react returns transitive dependencies', async () => {
    const packageName = 'react';
    const packageVersion = '16.13.0';

    const res = await got(
      `http://localhost:${port}/package/${packageName}/${packageVersion}`,
    ).json();

    expect(res.name).toEqual(packageName);

    // react's loose-envify version is ^1.1.0 -> update minor and patch
    expect(res.dependencies['loose-envify'].version).toEqual("1.4.0");

    // react's loose-envify version is ^1.1.0 -> update minor and patch
    expect(res.dependencies['loose-envify'].dependencies["js-tokens"]).toEqual({
      name: "js-tokens",
      version: "3.0.2",
      dependencies: null
    });
  });

  it('react returns transitive dependencies', async () => {
    const packageName = 'express';
    const packageVersion = '1.0.0';

    const res = await got(
      `http://localhost:${port}/package/${packageName}/${packageVersion}`,
    ).json();

    expect(res.name).toEqual(packageName);

    // express's accepts version is ~1.3.8 but that's the latest
    expect(res).toEqual({
      name: "express",
      version: "1.0.0",
      dependencies: {
        connect: {
          name: "connect",
          version: "0.3.0",
          dependencies: null
        }
      }
    });
  })
});
