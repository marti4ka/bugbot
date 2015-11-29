import {stack} from '../'
import request from 'request'
import find from '../methods/find'

function parseSlackMessage(msg, callback) {
  let cmds = stack()                                // all the commands
  let sub  = msg.text? msg.text.split(' ')[0] : ''  // sub command (foo from '/bb foo')
  let cmd  = `${msg.command} ${sub}`.trim()         // full command ('/bb foo')
  let ids  = Object.keys(cmds)                      // all the command ids
  let it   = ids.filter(id=> id.indexOf(cmd) > -1)  // array of matches
  let id   = it.length === 0? ids[0] : it[0]        // THE id or the first one
  // slash command middleware wut
  let middleware = cmds[id].reverse()
  // cleanup the payload signature: {raw, message, account}
  let payload = {
    ok: true,
    raw: msg,
    account: {},
    message: {
      token: msg.token, 
      response_url: msg.response_url, 
      channel_id: msg.channel_id,
      channel_name: msg.channel_name,
      command: msg.command,
      text: msg.text
    }
  }
  // lookup the account in the db
  find(payload.raw, (err, account)=> {
    
    if (err) {
      payload.ok = false
      payload.text = 'find method returned an error'
    }
    else if (!account) {
      payload.ok = true 
      payload.text = 'no account saved for this slack user'
    }
    else {
      payload.ok = true 
      payload.text = 'account found'
      payload.account = account
    }
    // end of find
    callback(err, {payload, middleware})
  })
}

// recives a slash command
export default function slash(req, res, next) {


  // parse out the payload and middleware for the Slack /command POST
  parseSlackMessage(req.body, (err, data)=> {

    function message(msg) {
      let url     = payload.message.response_url + '?token=' + payload.message.token
      let headers = {Accept: 'application/json'}
      let json    = true
      //let client_id = process.env.SLACK_CLIENT_ID
      //let client_secret = process.env.SLACK_CLIENT_SECRET

      let form = msg
      form.channel = payload.message.channel_id
      /*
      let form    = msg
      form.token  = payload.message.token 
      form.client_id = client_id
      form.client_secret = client_secret
      */
      let query   = {url, headers, form, json}
      request.post(query, (err, response)=> {
        // blackhole!
        console.log('POST TO SLACK', msg, err, response.body)
        res.json({text:res.body})
      })
      //res.status(200).json({text:'```'+JSON.stringify(payload, null, 2)+'```'})
      //
    }
    // payload is passed to each middleware fn 
    // each middleware fn is executed in serial by callee executing next()
    let {payload, middleware} = data
    // sends response to the Slack POST (halting the middleware exec)
    //let message = msg=> res.json(msg)
    // named iife for the first middleware fn
    ;(function iterator(i) {
      // grab the next middleware fn to exec
      let next = iterator.bind(null, i + 1)
      // exec the current middleware with args
      middleware[i].call({}, payload, message, next)
    })(0)
  })
}
