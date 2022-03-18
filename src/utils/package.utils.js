function chooseVersion(versions, versionNumber, qualifier) {
  if (versionNumber.match(/^(latest|\*)$/)) {
    // * | latest: last version in dependency array
    // * is any, so I arbitrarily chose to use latest
    return getLastVersion(versions)
  }

  switch(qualifier) {
    case "^":
      // ^: update all minor/patch versions
      return versionMinorAndPatch(versions, versionNumber);
      case "~":
      // ~: updates to latest patch versions
      return versionPatch(versions, versionNumber);
    case ">":
      return versionLargerThan(versions, versionNumber);
    case "<":
      return versionLessThan(versions, versionNumber);
  }
}

function parseVersionNumber(versionNumber) {
  // Can split by "." because qualifier's already removed
  let [ major, minor, patch ] = versionNumber.split(".");

  // Remove appendix from patch
  patch = patch.match(/^\d+/)[0];

  // appendix is the pre-release or build metadata
  // This regex is flawed because it doesn't account for
  // E.g. 1.x.x, 1+sef -> requires 3 dot-separated int sequences
  const appendix = versionNumber.split(/\d+\.\d+\.\d+/)[1]

  return [ Number(major), Number(minor), Number(patch), appendix];
}

function versionMinorAndPatch(versions, versionNumber) {
  let [ major, minor, patch, appendix ] = parseVersionNumber(versionNumber);

  const versionKeys = Object.keys(versions);

  versionKeys.forEach(key => {
    let [ tempMajor, tempMinor, tempPatch, tempAppendix ] = parseVersionNumber(key);

    if (major === tempMajor) {
      if (minor < tempMinor || patch < tempPatch) {
        [ minor, patch, appendix ] = [ tempMinor, tempPatch, tempAppendix ];
      }
    }
  });

  const key = `${major}.${minor}.${patch}${appendix}`;
  return versions[key];
}

function versionPatch(versions, versionNumber) {
  let [ major, minor, patch, appendix ] = parseVersionNumber(versionNumber);
  const versionKeys = Object.keys(versions);

  versionKeys.forEach(key => {
    let [ tempMajor, tempMinor, tempPatch, tempAppendix ] = parseVersionNumber(key);

    if (major === tempMajor && minor === tempMinor && patch < tempPatch) {
      patch = tempPatch;
      appendix = tempAppendix
    }
  });

  const key = `${major}.${minor}.${patch}${appendix}`;
  return versions[key];
}

function versionLargerThan(versions, versionNumber) {
  let [ major, minor, patch, appendix ] = parseVersionNumber(versionNumber);
  const versionKeys = Object.keys(versions);

  for (let i = 0; i < versionKeys.length; i++) {
    let [ tempMajor, tempMinor, tempPatch, tempAppendix ] = parseVersionNumber(key);

    if (tempMajor > major) {
      // If major is larger, return the version being iterated
      [ major, minor, patch, appendix ] = [ tempMajor, tempMinor, tempPatch, tempAppendix ]
      break
    } else if (tempMajor === major && tempMinor > minor) {
      // If major is equal and curent minor larger, return the version being iterated
      [ minor, patch, appendix ] = [ tempMinor, tempPatch, tempAppendix ]
      break
    } else if (tempMajor === major && tempMinor === minor && tempPatch > patch) {
      // If major and minor are equal and curent patch larger, return the version being iterated
      [ patch, appendix ] = [ tempPatch, tempAppendix ]
      break
    }
  }

  const key = `${major}.${minor}.${patch}${appendix}`;
  return versions[key];
}

function versionLessThan(versions, versionNumber) {
  let [ major, minor, patch, appendix ] = parseVersionNumber(versionNumber);
  const versionKeys = Object.keys(versions);

  for (let i = 0; i < versionKeys.length; i++) {
    let [ tempMajor, tempMinor, tempPatch, tempAppendix ] = parseVersionNumber(key);

    if (tempMajor < major) {
      // If major is lower, return the version being iterated
      [ major, minor, patch, appendix ] = [ tempMajor, tempMinor, tempPatch, tempAppendix ]
      break
    } else if (tempMajor === major && tempMinor < minor) {
      // If major is equal and curent minor lower, return the version being iterated
      [ minor, patch, appendix ] = [ tempMinor, tempPatch, tempAppendix ]
      break
    } else if (tempMajor === major && tempMinor === minor && tempPatch < patch) {
      // If major and minor are equal and curent patch lower, return the version being iterated
      [ patch, appendix ] = [ tempPatch, tempAppendix ]
      break
    }
  }

  const key = `${major}.${minor}.${patch}${appendix}`;
  return versions[key];
}

function getLastVersion(versions) {
  // Return the last version
  const versionKeys = Object.keys(versions);
  const key = versionKeys[versionKeys.length-1]

  return versions[key];
}

function hitVersionEndpoint(versionNumber, qualifier) {
  return !!versionNumber.match(/\d+.\d+.\d+/) &&
         (qualifier === null || !!qualifier.match(/=/))
}

function assignProperties(name, versionNumber, dependencies, result) {
  result.name = name;
  result.version = versionNumber;
  result.dependencies = dependencies;
}

function parseVersion(string) {
  // Separate the version number from the qualifier
  const hasNoNumbers = string.match(/^(latest|\*)$/);
  if (hasNoNumbers) {
    return [ hasNoNumbers[0] ];
  }

  let versionNumber;
  const stringHasX = string.match(/(\d+\.x\.\d+|\d+\.x\.x|\d+\.\d+\.x)/);

  if (stringHasX) {
    // Dumb solution: change guilty x to 0
    versionNumber = removeXVersionNumber(stringHasX[0])
  } else {
    if (string.split(".").length === 1) {
      // Check that the number is complete, e.g. avoid ^1
      // If incomplete, as before do dumb solution and assume 0
      string = string + ".0.0";
    }

    // Match numbers as they are to get the version number
    versionNumber = string.match(/\d+.\d+.\d+(.+)?/)[0];
  }

  let qualifier = string.match(/^[*^~]|>=?|<=?/);

  // If qualifier isn't null get value from resulting array
  if (qualifier !== null) {
    qualifier = qualifier[0]
  }

  // Return parsed
  return [ versionNumber, qualifier ];
}

function removeXVersionNumber(string) {
  // Input: dot-separated string in A.B.C format
  const arr = string.split(".");
  if (arr[1] === "x" || arr[1] === "X") {
    arr[1] = 0;
  }

  if (arr[2][0] === "x" || arr[2][0] === "X") {
    // Third element can include metadata, so check for
    arr[2] = "0" + arr[2].slice(1);
  }

  return arr.join(".");
}

module.exports = {
  hitVersionEndpoint,
  assignProperties,
  chooseVersion,
  parseVersion
}