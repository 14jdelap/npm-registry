# Hi!

This is my solution to the Snyk challenge.

The original exercise description is in `excercise-description.md`. My solution is in `package.js`.

## Approach and priorities

My objective was to return a JSON of the transitive dependencies.

My priorities were latency and accuracy (hitting the correct version numbers).

Latency was my main concern because a single npm packet may have dozens or even hundreds of transitive dependencies. Since I need to query one API for each dependency, this means getting a transitive dependency may be very expensive.

Accuracy was also important because of the need to parse data to find the correct version that I needed to use.

## Application logic: an incremental approach

### 1. Blocking promises

My first, naive implementation, depended on 2 decisions. You can see it in `src/deprecated/package-sequential.js`.

First, I used `async/await` to query each endpoint — meaning that each API query was blocking.

Second, I assumed low accuracy. For example, I didn't consider "qualifier" like `^`, `>` or `<` to determine a packet's version.

This "dumb" parsing approach worked as long as they had 3 dot-separated integers, like `^1.2.3`, and no metadata at the end (what I call "appendix"). However, it would fail when there was an appendix after the number with pre-release or build metadata (e.g. `^1.2.3+abc.12`), or if it didn't have the 3-digit format (e.g. `latest`, `*`, `^1.x.x`).

Thus, this low accuracy approach worked in most cases but could return an incorrect version (e.g. it wouldn't update the minor and patch version of `^1.2.3`) or raise an error (e.g. `latest`, `*`, etc).

### 2. Promise.all()

This second implementation was meant to solve a specific problem: my approach's expensive API calls.

I improved this by:

- Remove `await` from each promise that hit the npm registry
- Pushing each of these promises that hit the registry into a `promises` array
- Executing `await Promises.all(promises)` to execute a packet's dependencies simultaneously

This lowered latency by allowing the API calls of all the dependencies of a package to execute simultaneously rather than have each call block all operations.

You can see it in `src/deprecated/package-promiseAll.js`.

### 3. Branching endpoints

This final version attempted to increase the accuracy of the API. To make it more realistic, I increased the parsing logic to find the correct packet version instead of using the previous "dumb" approach that ignored this problem.

For example, before I'd treat `^1.2.3` as `1.2.3`, even though the correct answer might've been `1.5.2`. Similarly, `*` or `1.4.x` would've returned an error.

I improved this by writing utility functions (in `src/utils/package.utils.js`) to process the inputs. This allowed me to accurately handle cases like `*`, `latest`, `>1.4.2`, `^4.2.1`, and `^2.1.2+12aD-e`.

The implication of this approach was that I also needed to create logic to branch based on the API endpoint I'd hit.

If there was a specific version (e.g. `>=1.3.2`, `1.5.1`), I'd hit the `https://registry.npmjs.org/${name}/${versionNumber}` endpoint. This meant that only that version's data would be returned, allowing for less expensive API queries. However, if I needed to determine the version (e.g. `^1.2.1`, `>1.5.1`, `latest`) I'd have the hit the general `https://registry.npmjs.org/${name}` endpoint. This meant larger payload would be returned — and thus more latency.

While I've covered many edge cases, this iterations isn't exhaustive. For example, `express 4.17.3` fails because the `safer-buffer` dependency is of version `>= 2.1.2 < 3`.

This is the version in `src/package.js`.

## Testing and debugging

As I wrote the application I tested with logs and debugging tools.

I also changed the test cases to reflect the APIs new ability to get its transitive dependencies.

While this app's `package.js` code is reasonably well covered, this program still has mediocre testing because most lines in `package.utils.js` aren't tested.

File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                  
-------------------|---------|----------|---------|---------|------------------------------------
All files          |   54.62 |    38.24 |   68.42 |   55.12 |                                    
 src               |   95.24 |      100 |     100 |   95.12 |                                    
  app.js           |     100 |      100 |     100 |     100 |                                    
  package.js       |   94.29 |      100 |     100 |   94.12 | 42,65                              
 src/utils         |   35.23 |    27.59 |   53.85 |   36.05 |                                    
  package.utils.js |   35.23 |    27.59 |   53.85 |   36.05 | 5,14-18,57-130,148,156,161,181-191 
-------------------|---------|----------|---------|---------|------------------------------------

The problem related back to 2 limitations of my current approach:

1. Some edge cases like `>= 2.1.2 < 3` aren't covered
2. Some packages like `horus-agent` have so many dependencies requests timesout

Thus, while my intention was to use integrations tests that hit multiple packet endpoints with many dependencies to quickly get high coverage it isn't possible while this system doesn't work for all cases.

I could have substituted some of that with unit tests. However, getting high coverage through unit tests would've taken a higher time investment that I'll leave as future work.

## Pending work

The 3 most critical pending tasks are:

1. Add edge cases like `>= 2.1.2 < 3`
2. Improving latency
3. Improve automated testing suites (integration and potentially some unit tests)

Regarding 2, a low-hanging fruit is to cache responses to avoid unnecessary API calls. This is because a packet may have 2 or more transitive dependencies from the same packet.

These first 2 tasks are critical because they'd allow us to hit any packet endpoint. This would then allow us to validate our application logic with automated tests (see the problem I highlighted in the testing section).

Finally, the code's organization could be modified. However, to do this we should know how this small program will likely grow to know how to optimie it's maintainability and readability.

Beyond these points, some other area could include:

- Using rate limiters to protect against abusive behavior and DDoS attacks
- Handling error more gracefully to give users more granular information about what went wrong and return the appropriate HTTP status code
- Using [Helmet](https://helmetjs.github.io/) to protect the app by setting HTTP headers appropriately
- Scan the app with [Snyk](https://snyk.io) to identify dependencies with known vulnerabilities
- Setting up authorization to restrict who can use the app

## Potential issues

- Using a library to do the parsing
  - Wildcard versions: `*`, `latest` -> specific version number
- Implement caching
- Circular dependencies