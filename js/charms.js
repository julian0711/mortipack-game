export const CHARMS = [
    {
        id: "charm_A",
        name: "チャームA",
        baseDescription: "棚からのアイテム入手率アップ",
        minVal: 3,
        maxVal: 10,
        unit: "%",
        image: "images/charm_A.png",
        price: 100
    },
    {
        id: "charm_B",
        name: "チャームB",
        baseDescription: "不思議な力が宿るお守りB。",
        minVal: 1,
        maxVal: 5,
        unit: "",
        image: "images/charm_B.png",
        price: 200
    },
    {
        id: "charm_C",
        name: "チャームC",
        baseDescription: "不思議な力が宿るお守りC。",
        minVal: 10,
        maxVal: 20,
        unit: "",
        image: "images/charm_C.png",
        price: 300
    },
    {
        id: "charm_D",
        name: "チャームD",
        baseDescription: "不思議な力が宿るお守りD。",
        minVal: 50,
        maxVal: 100,
        unit: "",
        image: "images/charm_D.png",
        price: 400
    }
];

export function getCharmDetails(id) {
    return CHARMS.find(c => c.id === id);
}
