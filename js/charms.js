export const CHARMS = [
    { id: "charm_A", name: "チャームA", description: "不思議な力が宿るお守りA。", image: "images/charm_A.png", price: 100 },
    { id: "charm_B", name: "チャームB", description: "不思議な力が宿るお守りB。", image: "images/charm_B.png", price: 150 },
    { id: "charm_C", name: "チャームC", description: "不思議な力が宿るお守りC。", image: "images/charm_C.png", price: 200 },
    { id: "charm_D", name: "チャームD", description: "不思議な力が宿るお守りD。", image: "images/charm_D.png", price: 120 }
];

export function getCharmDetails(id) {
    return CHARMS.find(c => c.id === id);
}
