const jwt = require('jsonwebtoken')
const { TOKEN_SECRET } = require('./account-configs')

const SESSION_TTL = '12h'
const RESUME_LINK_TTL = '30d'

function signParticipantToken(pid, expiresIn = SESSION_TTL) {
    return jwt.sign({ pid: String(pid)}, TOKEN_SECRET, { expiresIn })
}

function verifyParticipantToken(token) {
    let payload
    try {
        payload = jwt.verify(token, TOKEN_SECRET)
    }
    catch (err) {
        return null
    }

    if (!payload.pid) {
        return null
    }
    
    return { pid: String(payload.pid) }
 }

 module.exports = { signParticipantToken, verifyParticipantToken, RESUME_LINK_TTL }