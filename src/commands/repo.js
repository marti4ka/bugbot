import slack from '../slack-bang-slash-hack'
import github from 'bugbot-github-issues'

export default function repoCmd(payload, message) {

  let parts = payload.message.text.split(' ')
  let legit = parts.length >= 2 
  let repo = parts[1]
  let hasArg = parts[0] === 'repo' && repo != ''
  let token = payload.account.github_token

  if (hasArg) {
    github.repos(token, (err, repos)=> {
      if (err) {
        message({text:err})
      }
      else {
        let found = repos.indexOf(repo) > -1
        if (found) {
          let acct = payload.account
          acct.github_repo = repo
          slack.save(acct, err=> {
            message({text: err? err : `Saved ${repo}`})
          })
        }
        else {
          message({text:`Bzzz. Github has nothing for ${repo}.`})
        }
      }
    })
  }
  else {
    let repo = payload.account.github_repo
    let text = repo? repo : `
        
No repo set! Select a repo by running:
       
  /bb repo username/reponame

You can list all your repos by running:

  /bb repos

  `
  }
  message({text})
}