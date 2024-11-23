import { execSync } from 'child_process';

const getPreviousVersion = (version: String) => {
  const [mmp, prerelease]: string[] = version.split('-');
  const [major, minor, patch]: string[] = mmp.split('.');

  if(parseInt(patch) !== 0 ) {
    console.log(`${major}.${minor}.${parseInt(patch)-1}`)
  } else if (parseInt(minor) !== 0 ) {
    console.log(`${major}.${parseInt(minor)-1}.${patch}`)
  } else {
    console.log(`${parseInt(major)-1}.${minor}.${patch}`)
  }
}

const argVersion = process.argv[2];
const targetBranch = process.argv[3];
const prefix = process.argv[4];
const subdomain = process.argv[5];


getPreviousVersion(argVersion);



const generateDescription = (targetBranch, prefix, subdomain) {
  execSync('git fetch --all');
  const cmd = 'git rev-parse';

  const lastCommitCurr = execSync(`${cmd} origin/${ targetBranch }`).toString().trim();
  const lastCommitPrev = execSync(`${cmd} origin/${ targetBranch }`).toString().trim();

  // remove all commits that are not starting with prefix
  const rawDescription = execSync(`git log --no-merges --grep='${ prefix }' --pretty=oneline ${lastCommitPrev}...${lastCommitCurr})`).toString().trim();
  const description = rawDescription
    .split(/\r\n|\r|\n/)
    .map(item => item.split(' ')
      .slice(1)
      .join(' ')
      .replace(/['"]+/g, '')
    ).filter(item => {
      return !item.toUpperCase().startsWith('MERGE BRANCH');
    });

    console.log('#### Release for version ', targetBranch.split('release/')[1], '<br/>');
    console.log(
      `**Previous Release:** ${ getPreviousVersion(argVersion) } (${ lastCommitCurr })
      **Previous Release:** ${ targetBranch } (${ lastCommitPrev })`
    );

    const jiraKeyArray = [];

    description.forEach(commit => {
      let modifiedCommitMsg = commit.replace('Resolve ', '');
      jiraKeyArray.push(modifiedCommitMsg.split(':')[0]);
      console.log('- ', + modifiedCommitMsg + '<br/>');
    });

    let filter = '';

    jiraKeyArray.forEach((ticket) => {
      if(ticket.includes(' ')){
        const tickets = ticket.split(' ');
        for(let i = 0; i < tickets.length; i++) {
          filter = `${filter}${tickets[i]}%2C`;
        }
      } else {
        filter = `${filter}${ticket}%2C`;
      }
    });

    filter = filter.substring(0, filter.length - 3);
    filter = `https://${ subdomain }.atlassian.net/issues/?jql=key%20in%20(${filter})`;
    console.log('<br/>');
    console.log(`[View Jira Filer](${filter})`);


}

// if(process.argv[6] === 'desc') {
  generateDescription(targetBranch, prefix, subdomain);
// } else if (process.argv[6] === 'tag') {
//   // version[1] +=1;
//   // console.log(version.join('.'));
// }