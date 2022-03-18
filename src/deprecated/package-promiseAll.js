const got = require('got');

async function getPackage() {
  const [ name, version ] = [ "react", "16.13.0" ];
  const result = {};
  await getPackageEndpoint(name, version, result);

  return result;
}

async function getPackageEndpoint(name, version, result) {
  const [ versionNumber, _ ] = parseVersion(version);
  try {
    const npmPackage = await got(
      `https://registry.npmjs.org/${name}/${versionNumber}`,
    ).json();

    const dependencies = npmPackage.dependencies || null;

    assignProperties(name, versionNumber, dependencies, result);

    // If no dependencies: base case, so do nothing
    // Else, get the package's dependencies
    // Need to await getDependencies for it to work
    !dependencies ? null : await getDependencies(dependencies, result);
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

async function getDependencies(dependencies, result) {
  const dependencyKeys = Object.keys(dependencies);
  const promises = [];

  for (let i = 0; i < dependencyKeys.length; i++) {
    const dependencyVersion = result.dependencies[dependencyKeys[i]];
    const dependencyObj = {}
    result.dependencies[dependencyKeys[i]] = dependencyObj;
    promises.push(getPackageEndpoint(dependencyKeys[i], dependencyVersion, dependencyObj));
  }

  await Promise.all(promises);
}

const hrstart = process.hrtime()

getPackage().then(res => {
  console.log(JSON.stringify(res, null, 4))
  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
});