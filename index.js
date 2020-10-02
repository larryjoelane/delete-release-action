const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('axios');

async function run() {
    try {
        const releaseName = core.getInput('release-name');

        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2)

        // debugging only
        const owner = 'lockton';
        const repo = 'benefits';

        console.log(payload);

        const GITHUB_TOKEN = core.getInput('token');

        // if (!process.env.INPUT_REPO) {
        //     console.warn("no `repo` name given. fall-ing back to this repo");
        // }

        // const [owner, repo] = (
        //     process.env.INPUT_REPO || process.env.GITHUB_REPOSITORY
        // ).split("/");

        // if (!owner || !repo) {
        //     const error = new error({
        //         message: "either owner or repo name is empty. exiting..."
        //     });
        //     errorHandler(error, core)
        // }

        const commonOpts = {
            host: "api.github.com",
            port: 443,
            protocol: "https:",
            auth: `user:${GITHUB_TOKEN}`,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "node.js",
            },
        };

        const release = (await getReleases(commonOpts, owner, repo))
          .filter(release => release.name === releaseName)
        await deleteRelease(commonOpts, owner, repo, release.id);


    } catch (ex) {
        errorHandler(ex, core, 'run()');
    }
}

async function deleteTag(commonOpts, owner, repo, tagName) {
    return await fetch({
        ...commonOpts,
        url: `/repos/${owner}/${repo}/git/refs/tags/${tagName}`,
        method: "DELETE",
    })
        .catch(error => errorHandler(error.message, core, 'deleteTag(commonOpts, owner, repo, tagName)'));;
}

async function deleteRelease(commonOpts, owner, repo, releaseId) {
    return await fetch({
        ...commonOpts,
        url: `/repos/${owner}/${repo}/releases/${releaseId}`,
        method: "DELETE",
    })
        .catch(error => errorHandler(error.message, core, 'deleteRelease(commonOpts, owner, repo, releaseId)'));
}

async function getReleases(commonOpts, owner, repo) {
    return await fetch({
        ...commonOpts,
        url: `/repos/${owner}/${repo}/releases`,
        method: "GET",
    })
        .catch(error => {
            console.log(error);
            errorHandler(error.message, 'getReleases(commonOpts, owner, repo)');
        });
}

function errorHandler(error, core, functionName) {
    console.error(error.message, functionName)
    process.exitCode = 1;
    // core.setFailed(error.message);
    return error;
}

run();
