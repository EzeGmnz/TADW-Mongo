
const express = require('express');
var prettyHtml = require('json-pretty-html').default;
const app = express()
const port = 3000

const { MongoClient } = require("mongodb");
app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    run().then(out => {

        res.writeHead(200, { 'Content-Type': 'text/html' });
        var body = '<html>' +
            '<head>' +
            '<link href="style.css" rel="stylesheet" type="text/css">' +
            '</head>' +
            '<body >' +
            prettyHtml(out, out.dimensions) +
            '</body>' +
            '</html>';
        res.end(body + '\n');
    });
})


const getStep = async (collection, paso) => {
    let out = { paso, peliculas: [] }

    const cursor = await collection.find({});

    await cursor.forEach(el => out.peliculas.push(el));

    return out
}


const uri = 'mongodb://localhost';
const client = new MongoClient(uri);

const getMovies = () => {
    return [
        {
            nombre: "Mad Max",
            actor: "Mel Gibson",
            estreno: "1979"
        },
        {
            nombre: "The invisible Guest",
            actor: "Bárbara Lennie",
            estreno: "2016"
        },
        {
            nombre: "Prisoners",
            actor: "Jake Gyllenhaal",
            estreno: "2013"
        },
        {
            nombre: "Dune",
            actor: "Kyle MacLachlan",
            estreno: "1984"
        },
        {
            nombre: "V for Vendetta",
            actor: "Natalie Portman",
            estreno: "2005"
        },
    ]
}

async function run() {
    let out = []
    try {
        await client.connect();

        // Crea una BD denominada "peliculas".
        const database = client.db("peliculas");
        const peliculas = database.collection("peliculas");

        // Reset
        peliculas.deleteMany({});

        // Utilice insertMany para insertar al menos 5 peliculas diferentes.Las peliculas deben tener al menos un nombre, un actor y el año de estreno.
        await peliculas.insertMany(getMovies());
        out.push(await getStep(peliculas, 'Insertar 5 películas'));

        // Utilice updateMany para agregar un campo "boxoffice" en todas las películas, inicializado en 0.
        await peliculas.updateMany({}, { $set: { boxoffice: 0 } });
        out.push(await getStep(peliculas, 'Agregar Campo boxoffice'));

        // Utilice replaceOne para reemplazar una película.
        await peliculas.replaceOne({ nombre: 'Dune' }, {
            nombre: "Monty Python and the Holy Grail",
            actor: "John Cleese",
            estreno: "1975"
        })
        out.push(await getStep(peliculas, 'Utilice replaceOne para reemplazar una película'));

        // Recupere y liste todas las películas que se estrenaron antes de un año determinado.
        const cursorPrev2000 = peliculas.find({ estreno: { $lt: '2000' } });

        let step = {
            paso: 'Recupere y liste todas las películas que se estrenaron antes de un año determinado.',
            peliculas: []
        }
        cursorPrev2000.forEach(el => step.peliculas.push(el))
        out.push(step);

        // Quitar el campo "boxoffice" de una sola de las películas.
        await peliculas.updateOne({ nombre: 'Monty Python and the Holy Grail' }, { $unset: { boxoffice: 1 } });
        out.push(await getStep(peliculas, 'Quitar el campo "boxoffice" de una sola de las películas'));


    } finally {
        await client.close();
    }

    return out;
}


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
