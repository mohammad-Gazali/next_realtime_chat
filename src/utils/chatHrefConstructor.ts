export default function chatHrefConstructor(id1: string, id2: string) {
    const sortedIds = [id1, id2].sort();

    return sortedIds.join("----")
}