const express = require("express");

const app = express()
const port = 3000;

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'ejs')

app.get("/:path", (req, res) => {
    if (req.params.path === "favicon.ico") res.sendStatus(200)
    else res.render(req.params.path)
})

app.get("/:path1/:path2", (req, res) => {
    res.render(req.params.path1 + "/" + req.params.path2)
})

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))