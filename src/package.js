const got = require('got');
const utils = require("./utils/package.utils");

async function getPackage(req, res, next) {
  const { name, version } = req.params;
  const result = {};
  await getPackageEndpoint(name, version, result, next)

  res.status(200).json(result);
}

async function getPackageEndpoint(name, version, result, next) {
  const [ versionNumber, qualifier ] = utils.parseVersion(version);

  if (utils.hitVersionEndpoint(versionNumber, qualifier)) {
    // If version number is /\d+.\d+.\d+/ AND null or = qualifier
    // Get a specific version's endpoint
    await getVersionEndpoint(name, versionNumber, result, next)
  } else {
    // Get generic endpoint and use qualifier to determine version I hit
    await getGenericEndpoint(name, versionNumber, qualifier, result, next)
  }
}

async function getVersionEndpoint(name, versionNumber, result, next) {
  try {
    const npmPackage = await got(
      `https://registry.npmjs.org/${name}/${versionNumber}`,
    ).json();

    const dependencies = npmPackage.dependencies || null;

    // Assign data to the result object
    utils.assignProperties(name, versionNumber, dependencies, result);

    // If no dependencies: base case, so do nothing
    // Need to await getDependencies for it to work
    !dependencies ? null : await getDependencies(dependencies, result, next);
  } catch (error) {
    return next(error);
  }
}

async function getGenericEndpoint(name, versionNumber, qualifier, result, next) {
  try {
    const npmPackage = await got(
      `https://registry.npmjs.org/${name}`,
    ).json();

    // Iterate over versions and find correct package version number
    const packageVersion = utils.chooseVersion(npmPackage.versions, versionNumber, qualifier)

    // Get the package version's dependencies
    const dependencies = packageVersion.dependencies || null;

    // Assign data to the result object
    utils.assignProperties(name, packageVersion.version, dependencies, result);

    // If no dependencies: base case, so do nothing
    // Need to await getDependencies for it to work
    !dependencies ? null : await getDependencies(dependencies, result, next);
  } catch (error) {
    return next(error);
  }
}

async function getDependencies(dependencies, result, next) {
  const dependencyKeys = Object.keys(dependencies);
  const promises = [];

  for (let i = 0; i < dependencyKeys.length; i++) {
    const dependencyVersion = result.dependencies[dependencyKeys[i]];
    const dependencyObj = {}
    result.dependencies[dependencyKeys[i]] = dependencyObj;

    promises.push(
      getPackageEndpoint(
        dependencyKeys[i],
        dependencyVersion,
        dependencyObj,
        next
      )
    );
  }

  await Promise.all(promises);
}

module.exports = { getPackage }