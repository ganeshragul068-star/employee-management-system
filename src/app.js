const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    skills: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        required: true
    }
});

const Employee = mongoose.model("Employee", employeeSchema);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/add", async (req, res) => {
    try {
        const employee = new Employee({
            employeeId: req.body.employeeId,
            name: req.body.name,
            department: req.body.department,
            designation: req.body.designation,
            salary: Number(req.body.salary),
            experience: Number(req.body.experience),
            skills: req.body.skills
                ? req.body.skills.split(",").map(skill => skill.trim())
                : [],
            status: req.body.status
        });

        await employee.save();

        res.send(`
            <h2>Employee added successfully</h2>
            <a href="/">Go Back</a>
        `);
    } catch (error) {
        res.send(`
            <h2>Error: ${error.message}</h2>
            <a href="/">Go Back</a>
        `);
    }
});

app.get("/employees", async (req, res) => {
    try {
        const employees = await Employee.find()
            .sort({ salary: -1 });

        res.json(employees);
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get("/department", async (req, res) => {
    try {
        const department = req.query.department;
        const experience = Number(req.query.experience);

        const employees = await Employee.find({
            department: department,
            experience: { $gt: experience }
        });

        res.json(employees);
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get("/find/:employeeId", async (req, res) => {
    try {
        const employee = await Employee.findOne({
            employeeId: req.params.employeeId
        }).select("name designation salary department -_id");

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json(employee);
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.put("/update/:employeeId", async (req, res) => {
    try {
        const employee = await Employee.findOneAndUpdate(
            { employeeId: req.params.employeeId },
            {
                designation: req.body.designation,
                salary: Number(req.body.salary)
            },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({
            message: "Employee updated successfully",
            employee: employee
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.put("/increase-salary", async (req, res) => {
    try {
        const department = req.body.department;
        const amount = Number(req.body.amount);

        const result = await Employee.updateMany(
            { department: department },
            { $inc: { salary: amount } }
        );

        res.json({
            message: "Salary increased successfully",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get("/salary-range", async (req, res) => {
    try {
        const min = Number(req.query.min);
        const max = Number(req.query.max);

        const employees = await Employee.find({
            salary: {
                $gte: min,
                $lte: max
            }
        });

        res.json(employees);
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.delete("/delete/:employeeId", async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({
            employeeId: req.params.employeeId
        });

        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        res.send(`
            <h2>Employee deleted successfully</h2>
            <a href="/">Go Back</a>
        `);
    } catch (error) {
        res.send(`
            <h2>Error: ${error.message}</h2>
            <a href="/">Go Back</a>
        `);
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(process.env.PORT, () => {
            console.log("Server running on port " + process.env.PORT);
        });
    })
    .catch(error => {
        console.log("MongoDB connection error:", error.message);
    });