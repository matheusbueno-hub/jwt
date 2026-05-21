const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
app.use(express.json());

const SECRET = "segredo_super_simples";

// LOG FUNCTION
function log(message) {
    const time = new Date().toISOString();
    const fullMessage = `[${time}] ${message}\n`;

    console.log(fullMessage);

    fs.appendFileSync("logs.txt", fullMessage);
}

// USUÁRIOS SIMULADOS
const users = [
    {
        id: 1,
        email: "admin@teste.com",
        password: "123",
        role: "admin"
    },
    {
        id: 2,
        email: "user@teste.com",
        password: "123",
        role: "user"
    }
];

// LOGIN (gera token)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        log(`LOGIN FALHOU - ${email}`);
        return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: "1h" }
    );

    log(`LOGIN OK - ${email} (${user.role})`);

    return res.json({ token });
});

// MIDDLEWARE JWT
function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        log("ACESSO NEGADO - token ausente");
        return res.status(401).json({ message: "Token necessário" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;

        log(`TOKEN OK - usuário ${decoded.id} (${decoded.role})`);
        next();
    } catch (err) {
        log("TOKEN INVÁLIDO");
        return res.status(401).json({ message: "Token inválido" });
    }
}

// ROLE CHECK
function isAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        log(`ACESSO NEGADO - usuário ${req.user.id} não é admin`);
        return res.status(403).json({ message: "Acesso negado (admin apenas)" });
    }

    next();
}

// ROTAS

app.get("/", (req, res) => {
    log("GET / acessado");
    res.send("API funcionando");
});

// rota protegida (qualquer usuário logado)
app.get("/profile", auth, (req, res) => {
    log(`PROFILE acessado por ${req.user.id}`);
    res.json({ message: "Perfil acessado", user: req.user });
});

// rota admin
app.get("/admin", auth, isAdmin, (req, res) => {
    log(`ADMIN acessado por ${req.user.id}`);
    res.json({ message: "Área administrativa" });
});

// START SERVER
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
    log("SERVIDOR INICIADO em http://localhost:3000");
});
