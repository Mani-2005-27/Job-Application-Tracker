const express = require("express");
const sql = require("mssql/msnodesqlv8");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
    server: "MANIKANDAN\\SQLEXPRESS01",
    database: "JobApplicationTracker",
    driver: "ODBC Driver 18 for SQL Server",
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

sql.connect(dbConfig)
    .then(() => {
        console.log("SQL Server connected successfully!");
    })
    .catch((err) => {
        console.log("Database connection failed:", err.message);
    });

app.get("/", (req, res) => {
    res.send("Job Application Tracker Backend is running!");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query(`
                SELECT id, email
                FROM Users
                WHERE email = @email
                AND password = @password
            `);

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                message: "Login successful!"
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

    } catch (error) {
        console.log("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.post("/applications", async (req, res) => {
    const { company, role, applied_date, status } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input("company", sql.VarChar, company)
            .input("role", sql.VarChar, role)
            .input("applied_date", sql.Date, applied_date)
            .input("status", sql.VarChar, status)
            .query(`
                INSERT INTO JobApplications
                (company, role, applied_date, status)
                VALUES
                (@company, @role, @applied_date, @status)
            `);

        res.json({
            success: true,
            message: "Job Application Added!"
        });

    } catch (error) {
        console.log("Application save error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to save application"
        });
    }
});

app.get("/applications", async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
            SELECT id, company, role, applied_date, status
            FROM JobApplications
            ORDER BY id DESC
        `);

        const applications = result.recordset.map(job => ({
            id: job.id,
            company: job.company,
            role: job.role,
            applied_date: job.applied_date
                ? new Date(job.applied_date).toISOString().split("T")[0]
                : "",
            status: job.status
                ? job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()
                : ""
        }));

        res.json({
            success: true,
            applications: applications
        });

    } catch (error) {
        console.log("Get applications error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to get applications"
        });
    }
});

app.put("/applications/:id", async (req, res) => {
    const { id } = req.params;
    const { company, role, applied_date, status } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input("id", sql.Int, id)
            .input("company", sql.VarChar, company)
            .input("role", sql.VarChar, role)
            .input("applied_date", sql.Date, applied_date)
            .input("status", sql.VarChar, status)
            .query(`
                UPDATE JobApplications
                SET
                    company = @company,
                    role = @role,
                    applied_date = @applied_date,
                    status = @status
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: "Application updated successfully!"
        });

    } catch (error) {
        console.log("Update error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update application"
        });
    }
});

app.delete("/applications/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM JobApplications
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: "Application deleted successfully!"
        });

    } catch (error) {
        console.log("Delete error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete application"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});