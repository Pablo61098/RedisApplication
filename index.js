const express = require("express");
let app = express();

const redis = require("redis");
const e = require("express");
const client = redis.createClient();
const bodyParser = require("body-parser");
const { render } = require("ejs");


app.set("view engine", "ejs");


client.on("connect", function(){
    console.log("Conectado a Redis");
});


app.get("/", function(req, res){
    res.render("busqueda");
});

app.get("/borrar", function(req, res){
    client.flushall();
    res.render("busqueda");
});


app.use(bodyParser.urlencoded({extended: true}));

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function makeText(length) {
    var words =["The sky", "above", "the port","was", "the color of television", "tuned", "to", "a dead channel", ".", "All", "this happened", "more or less","." ,"I", "had", "the story", "bit by bit", "from various people", "and", "as generally", "happens", "in such cases", "each time", "it", "was", "a different story","." ,"It", "was", "a pleasure", "to", "burn"];
    var text = [];
    while(--length) text.push(words[Math.floor(Math.random() * words.length)]);
    return text.join(" ")
 }

 function getFecha(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    if(mm == 1){
        mm = mm + Math.floor( (Math.random() * 10) + 1);
    }else{
        if(mm == 12){
            mm = mm - Math.floor( (Math.random() * 10) + 1);
        }
        if(mm < 6){
            mm = mm + Math.floor( (Math.random() * 5) + 1);
        }else{
            mm = mm - Math.floor( (Math.random() * 5) + 1);
        }
    }

    today = dd + '/' + mm + '/' + yyyy;    
    return today;
 }


app.get("/generar",function(req, res){

    fecha = getFecha();

    let id_evolucion = "nada";
    var start = new Date();
    var hrstart = process.hrtime();
    for(let i=0; i<200000; i++){
        id_evolucion = create_UUID();
        registros = create_UUID();
        descripcion = makeText(44);
        tratamiento = create_UUID();

        client.hmset('evolucion:'+id_evolucion, [
            'registros', registros,
            'descripcion', descripcion,
            'tratamiento', tratamiento,
        ]);

        for(let j=0; j<5; j++){
            client.sadd('registros:'+registros, getFecha());
        }

        for(let j=0; j<1; j++){
            client.hmset( 'tratamiento:'+tratamiento , [
                'date', fecha,
                'descripcion', makeText(20) ,
            ]);
        }
    }



    client.keys("evolucion:*", function(err,llaves){
        if(err){
            console.log("Ha habido un error");
        }else{
            for(let i=0; i<5000; i++){
                let medico=create_UUID();
                for(let j=0; j<5; j++){
                    client.sadd('medico:'+medico, llaves[Math.floor((Math.random() * (99)) + 1)] );
                }
            }
            for(let i=0; i<150000; i++){
                let atencion = create_UUID();
                for(let j=0; j<5; j++){
                    client.sadd('atencion:'+atencion, llaves[Math.floor((Math.random() * (99)) + 1)] );
                }
            }
            for(let i=0; i<100000; i++){
                let historial = create_UUID();
                for(let j=0; j<5; j++){
                    client.sadd('historial:'+historial, llaves[Math.floor((Math.random() * (99)) + 1)] );
                }
            }
        } 
    });

    console.log("Se ha creado las evoluciones exitosamente");
    
    var end = new Date() - start,
    hrend = process.hrtime(hrstart)

    console.info('Tiempo de ejecucion de busqueda: %dms', end)
    console.info('Tiempo de ejecucion de busqueda mas precisa: %ds %dms', hrend[0], hrend[1] / 1000000)
    
    res.render("/busqueda");
});


app.post("/buscar", function(req, res){
    console.log(req.body);

    
    var start = new Date();
    var hrstart = process.hrtime();
    if(req.body.campoBusqueda =='Evolucion'){
        client.hgetall("evolucion:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }else if(req.body.campoBusqueda =='Tratamiento'){
        client.hgetall("tratamiento:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }else if(req.body.campoBusqueda =='Registro'){
        client.smembers("registros:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }else if(req.body.campoBusqueda =='Medico'){
        client.smembers("medico:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }else if(req.body.campoBusqueda =='Atencion'){
        client.smembers("atencion:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }else if(req.body.campoBusqueda =='Historial'){
        client.smembers("historial:"+req.body.clave, function(err, campos){
            if(campos == null || campos == []){
                console.log(err);
                res.render("busqueda");
            }else{
                console.log(campos);
                res.render("busqueda", {campos: campos, campoBusqueda: req.body.clave });
            }
        });
    }
    
    
    var end = new Date() - start,
    hrend = process.hrtime(hrstart)

    console.info('\n\nTiempo de ejecucion de busqueda: %dms', end)
    console.info('Tiempo de ejecucion de busqueda mas precisa: %ds %dms\n', hrend[0], hrend[1] / 1000000)

});

app.listen(3000, function(req, res){
    console.log("El servidor esta activo");
});




