// The server gives participants a signed token for their PID when their sessions starts
// It is kept for this browser tab only and sent with every API request

const STORAGE_KEY = 'participantToken'

export function getParticipantToken() {
    try {
        return sessionStorage.getItem(STORAGE_KEY)
    }
    catch (err) {
        return null
    }
}

export function setParticipantToken(token) {
    if (!token) {
        return
    }
    try {
        sessionStorage.setItem(STORAGE_KEY, token)
    }
    catch (err) {
        console.warn('Could not store participant token')
    }
}