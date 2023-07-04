import { MyAdmin } from "constants/wrapper-classes/firebase-admin";
import { MyFunctions } from "constants/wrapper-classes/firebase-functions";
import { logger } from "firebase-functions/v1";


interface ItemInterface {
    id: number;
    name: string;
    image: string;
    price: number;
    available: boolean; 
}


interface GridItem {
    id: number,
    name: string;
    image: string;
}


exports.getAllItems = MyFunctions.https.onRequest(async (request, response) => {
    if(request.method != 'GET'){
        response.status(400).send("This HTTP function has method type 'POST'");
        return;
    }
    
    const docSnap = (await MyAdmin.firestore().collection('MSP').doc('Data').get()).data();
    
    logger.log("allItems", docSnap?.allItems);
    response.send(docSnap?.allItems.map(transormToGridItem));

    function transormToGridItem(item: ItemInterface) : GridItem {
        return {
            id: item.id,
            name: item.name,
            image: item.image
        };
    }
});

exports.getItem = MyFunctions.https.onRequest(async (request, response) => {

    if(request.method != 'GET'){
        response.status(400).send("This HTTP function has method type 'POST'");
        return;
    }

    const idAsString = request.query.id;

    if(!idAsString){
        response.status(400).send("please pass the itemId as 'id'");
        return;
    }

    let id: number;
    try {
        id = parseInt(idAsString.toString());
    } catch (error) {
        response.status(400).send("the 'id' should be an int");
        return;
    }
    
    const docSnap = (await MyAdmin.firestore().collection('MSP').doc('Data').get()).data();

    const allItems: ItemInterface[] = docSnap!.allItems;
    const item = allItems.find(item => item.id == id);

    if(item){
        const itemExtra: any = item;
        itemExtra.createdAt = 1680389653000
        itemExtra.ownerId = 'fghfds3452fdc35'
        response.send(itemExtra);
    }
    else {
        response.status(404).send(`no item found with id=${id}`)
    }
    
});

exports.addItem = MyFunctions.https.onRequest(async (request, response) => {

    if(request.method != 'POST'){
        response.status(400).send("This HTTP function has method type 'POST'");
        return;
    }
    
    const itemData: ItemInterface = request.body;

    if(!itemData.name || !itemData.image || !itemData.price){
        response.status(400).send("name, image and price cannot be null");
        return;
    }

    const doc = MyAdmin.firestore().collection('MSP').doc('Data')
    const docSnap = (await doc.get()).data();
    const allItems: ItemInterface[] = docSnap!.allItems;

    const newItem: ItemInterface = {
        id: docSnap!.nextId,
        name: itemData.name,
        image: itemData.image,
        price: itemData.price,
        available: itemData.available ?? false
    }

    allItems.push(newItem)

    await doc.update({
        'allItems' : allItems,
        'nextId' : MyAdmin.firestore.FieldValue.increment(1)
    })
    response.json(newItem)
    
});


exports.updateItem = MyFunctions.https.onRequest(async (request, response) => {

    if(request.method != 'POST'){
        response.status(400).send("This HTTP function has method type 'POST'");
        return;
    }
    
    const itemData: ItemInterface = request.body;

    if(itemData.id == undefined){
        response.status(400).send("'id' cannot be null");
        return;
    }

    const doc = MyAdmin.firestore().collection('MSP').doc('Data')
    const docSnap = (await doc.get()).data();

    const allItems: ItemInterface[] = docSnap!.allItems;
    const item = allItems.find(item => item.id == itemData.id);

    if(item){

        item.name = itemData.name ?? item.name;
        item.price = itemData.price ?? item.price;
        item.image = itemData.image ?? item.image;
        item.available = itemData.available ?? item.available;

        await doc.update({
            'allItems' : allItems
        })
        response.json(true)
    }
    else {
        response.status(404).send(`no item found with id=${itemData.id}`)
    }

    
    
});


exports.deleteItem = MyFunctions.https.onRequest(async (request, response) => {

    if(request.method != 'GET'){
        response.status(400).send("This HTTP function has method type 'POST'");
        return;
    }
    
    const idAsString = request.query.id;

    if(!idAsString){
        response.status(400).send("please pass the itemId as 'id'");
        return;
    }

    let id: number;
    try {
        id = parseInt(idAsString.toString());
    } catch (error) {
        response.status(400).send("the 'id' should be an int");
        return;
    }

    const doc = MyAdmin.firestore().collection('MSP').doc('Data')
    const docSnap = (await doc.get()).data();
    const allItems: ItemInterface[] = docSnap!.allItems;

    const itemIndex = allItems.findIndex(item => item.id == id);

    if(itemIndex == -1){
        response.status(404).send(`no item found with id=${id}`)
    }
    else {
        allItems.splice(itemIndex, 1);
        await doc.update({
            allItems : allItems
        })
        response.json(true)
    }
});
