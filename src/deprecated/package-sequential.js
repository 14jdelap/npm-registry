const got = require('got');

async function getReactPackage() {
  const [ name, versionNumber ] = [ "react", "16.13.0" ];
  const result = {};
  await getPackage(name, versionNumber, result);

  return result;
}

async function getPackage(name, version, result) {
  const [ versionNumber, _ ] = parseVersion(version);

  try {
    const npmPackage = await got(
      `https://registry.npmjs.org/${name}/${versionNumber}`,
    ).json();

    const dependencies = npmPackage.dependencies || null;

    assignProperties(name, versionNumber, dependencies, result);

    if (!dependencies) {
      return;
    }

    const dependencyKeys = Object.keys(dependencies);

    for (let i = 0; i < dependencyKeys.length; i++) {
      const dependencyVersion = result.dependencies[dependencyKeys[i]];
      const dependencyObj = {}
      result.dependencies[dependencyKeys[i]] = dependencyObj;

      await getPackage(dependencyKeys[i], dependencyVersion, dependencyObj);
    }
  } catch (error) {
    return console.log(error);
  }
}

function assignProperties(name, versionNumber, dependencies, result) {
  result.name = name;
  result.version = versionNumber;
  result.dependencies = dependencies;
}

function parseVersion(string) {
  // Separate the version number from the qualifier
  let versionNumber = string.match(/\d+.\d+.\d+/)[0];
  let qualifier = string.match(/^[*^~]|>=?|<=?/);

  // If qualifier isn't null get  value from resulting array
  if (qualifier !== null) {
    qualifier = qualifier[0]
  }

  // Return parsed
  return [ versionNumber, qualifier ];
}

const hrstart = process.hrtime()
getReactPackage().then(res => {
  console.log(JSON.stringify(res, null, 4))
  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
});