const core = require('@actions/core');
const github = require('@actions/github');
const octokit = require('@octokit/request');

async function run() {
    try {
        const releaseName = core.getInput('release-name');

        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2)

        // const owner = github.context.payload.repository.owner.name;
        // const repo = github.context.payload.repository.name;
        const owner = 'Lockton-Companies';
        const repo = 'benefits';

        const GITHUB_TOKEN = core.getInput('token');

        const commonOpts = {
            host: "api.github.com",
            port: 443,
            protocol: "https:",
            auth: `user:${GITHUB_TOKEN}`,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "node.js",
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            },
        };

        const releases = await getReleases(commonOpts, owner, repo);
        console.log(releases)

        const release = releases.filter(release => {
              console.log(release);
              console.log(`${release.name} === ${releaseName}`);
              return release.name === releaseName;
          }).data;
          
        await deleteRelease(commonOpts, owner, repo, release.id);


    } catch (ex) {
        errorHandler(ex, core, 'run()');
    }
}

async function deleteTag(commonOpts, owner, repo, tagName) {

    return await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/tags/{tagName}', {
        owner: owner,
        repo: repo,
        tagName: tagName,
        headers: commonOpts.headers
      })
        .catch(error => errorHandler(error.message, core, 'deleteTag(commonOpts, owner, repo, tagName)'));;
}

async function deleteRelease(commonOpts, owner, repo, releaseId) {

    return await octokit.request('DELETE /repos/{owner}/{repo}/releases/{releaseId}', {
        owner: owner,
        repo: repo,
        releaseId: releaseId,
        headers: commonOpts.headers
      })
        .catch(error => errorHandler(error.message, core, 'deleteRelease(commonOpts, owner, repo, releaseId)'));
}

async function getReleases(commonOpts, owner, repo) {
    return await octokit.request('GET /repos/{owner}/{repo}/releases', {
        owner: owner,
        repo: repo,
        headers: commonOpts.headers
      })
        .catch(error => {
            console.log(error);
            errorHandler(error.message, 'getReleases(commonOpts, owner, repo)');
        });
}

function errorHandler(error, core, functionName) {
    console.error(error.message, functionName)
    process.exitCode = 1;
    core.setFailed(error.message);
    return error;
}

run();
