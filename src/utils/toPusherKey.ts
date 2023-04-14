function toPusherKey(key: string) {
    return key.replace(/:/g, '__')
}


export default toPusherKey;