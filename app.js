const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Task = require('./model');
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const MONGO_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tuna9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(MONGO_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
});


// JWT secret key
const JWT_SECRET = process.env.JWT;
// Middleware for JWT authentication

app.get('/', (req, res) => {
    res.render('login'); // Pass an empty message initially
});


// LOGIN CODE 
app.get('/login', (req, res) => {
    res.render('login.ejs'); // Pass an empty message initially
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists in the database
        const user = await Task.findOne({ username });


        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }


        console.log("------------fprofile----------------------");
        console.log(user);

        // If username and password are correct, generate JWT token
        // const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Set JWT token in an HTTP-only cookie
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/home'); // Redirect to home page after successful login
    } catch (error) {
        console.error(error);
        res.redirect('/login'); // Redirect to home page after
        // res.status(500).json({ message: 'Internal server error' });
    }
});


// Create middleware to extract JWT token from HTTP-only cookie
function extractTokenFromCookie(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        req.token = token;
    }
    next();
}

// Apply the extractTokenFromCookie middleware after cookie-parser
app.use(extractTokenFromCookie);

// Update the authenticateToken middleware to use the token extracted from the cookie
function authenticateToken(req, res, next) {
    const token = req.token;
    if (!token) {
        // res.sendStatus(401);
        setTimeout(() => {
            res.redirect('/login');
        }, 3000); // 3000 milliseconds = 3 seconds
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // res.sendStatus(403);
            setTimeout(() => {
                res.redirect('/login');
            }, 1000); // 3000 milliseconds = 3 seconds
            return;
            // return res.sendStatus(403);
        }

        console.log('----------------AUTH INSIDE----------------');
        console.log(decoded);
        // req.user = user;
        // Store user ID in the request object
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    });
}

// Apply the extractTokenFromCookie middleware to all routes
app.use(extractTokenFromCookie);


//REGISTER 
app.get('/register', (req, res) => {
    res.render('register', { message: '' }); // Pass an empty message initially
});

app.post('/register', async (req, res) => {
    // const { username, password } = req.body;
    const { username, password, phone_number } = req.body;

    try {
        // Check if the userpriorityname already exists
        const existingUser = await Task.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new Task({
            username: username,
            password: hashedPassword,
            phone: phone_number,
            priority: null,
        });

        // Save the user to the database
        await newUser.save();

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});



//HOME

app.get('/home', authenticateToken, (req, res) => {


    console.log('-----------------------------INSIDE /HOME GET-----------------------------------')
    const userId = req.userId;
    const username = req.username;
    // console.log("ppppppppppppppp = " + userId);

    Task.find({ userid: userId })
        .then(tasks => {

            console.log(tasks);

            res.render("home", { username, token: req.token, tasks }); // Render the Alltask view with tasks data
        })
        .catch(error => {
            res.status(500).json({ error: 'Internal server error' });
        });

    console.log('-----------------------------OUTSIDE /HOME GET-----------------------------------')
});

// LOGOUT
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login'); // Redirect to the login page after logout
});


app.get('/api/tasks', authenticateToken, (req, res) => {
    res.render('CreateTask');
});

// create a new task
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description, due_date, status } = req.body;

    const user = req.userId;

    console.log("------------API-TASK--------------------");
    console.log(user);
    // Create a new task object
    const newTask = new Task({
        userid: user,
        title: title,
        description: description,
        due_date: due_date,
        status: status,
        docx_type: "task",

        // other fields can be assigned here
    });

    console.log(newTask);

    // Save the task to the database
    newTask.save()
        .then(task => {
            res.json({ message: 'Task created successfully', task: task });
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});



// DISPLAY ALL SUB TASK

app.get('/api/subtasks', authenticateToken, (req, res) => {
    res.render('CreateSubTask');
});

// CREATE NEW SUB TASK
app.post('/api/subtasks', authenticateToken, (req, res) => {
    console.log("------------API-SUB-TASK--------------------");
    const { task_id, status1, dele_date } = req.body;

    console.log("status: " + status1);
    const user = req.userId;

    console.log(user);
    // Create a new task object
    const newTask = new Task({
        task_id: task_id,
        status: status1,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: dele_date,
        docx_type: "subtask",
    });

    console.log('---------');
    console.log(newTask);

    // Save the task to the database
    newTask.save()
        .then(task => {
            res.json({ message: 'Task created successfully', task: task });
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});


// DISPLAY API TO SHOW ALL SUB TASK
app.post('/api/GetAllSubTasks', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/GetAllSubTasks------------------");

    const userId = req.userId; // Assuming req.userId is correctly set by your authentication middleware

    // Fetch task IDs associated with the user ID
    const tasks = await Task.find({ docx_type: "task", userid: userId });
    const taskIDs = tasks.map(task => task._id);

    // console.log("Task IDs associated with the user:", taskIDs);

    // Fetch subtasks for each task ID
    const subtasks = [];
    for (let i = 0; i < taskIDs.length; i++) {
        const taskId = taskIDs[i];
        const subtask = await Task.find({ docx_type: "subtask", task_id: taskId });
        subtasks.push(subtask);
    }

    console.log("Subtasks associated with the user:", subtasks);
    // console.log("tasks associated with the user:", taskIDs);

    res.render("ShowAllSubtask.ejs", { subtasks, tasks }); // Render the Alltask view with subtasks data

    console.log("--------------OUTSIDE /api/GetAllSubTasks------------------");


});


// GET UPDATE TASK
app.post('/api/UpdateTasks', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/UpdateTasks------------------");

    const taskId = req.body.taskId; // Assuming req.userId is correctly set by your authentication middleware
    if (taskId == "None") {
        res.json({ message: 'Select VALID task' });
    }
    else {


        try {
            // Find the document with the taskId
            const tasks = await Task.findById(taskId);

            if (!tasks) {
                // If no task is found, send an appropriate response
                return res.status(404).json({ message: 'Task not found' });
            }

            // If the task is found, you can perform further operations here
            console.log(tasks);

            // Send the found task as a response or perform other operations
            res.render("UpdateTask", { tasks }); // Render the Alltask view with subtasks data

        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }

    }
    console.log("--------------OUTSIDE /api/UpdateTasks------------------");


});


// SET UPDATED TASK
app.post('/api/UpdateTasks', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/UpdateTasks------------------");

    const taskId = req.body.taskId; // Assuming req.userId is correctly set by your authentication middleware
    if (taskId == "None") {
        res.json({ message: 'Select VALID task' });
    }
    else {


        try {
            // Find the document with the taskId
            const tasks = await Task.findById(taskId);

            if (!tasks) {
                // If no task is found, send an appropriate response
                return res.status(404).json({ message: 'Task not found' });
            }

            // If the task is found, you can perform further operations here
            console.log(tasks);

            // Send the found task as a response or perform other operations
            res.render("UpdateTask", { tasks }); // Render the Alltask view with subtasks data

        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }

    }
    console.log("--------------OUTSIDE /api/UpdateTasks------------------");


});


// SET UPDATED TASK
app.post('/api/UpdateTaskstoMongoDB', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/UpdateTaskstoMongoDB------------------");

    const taskId = req.query.id;
    const status = req.body.status;
    const date = req.body.due_date;
    console.log(taskId);
    try {
        // Find the document with the taskId
        const tasks = await Task.findByIdAndUpdate(taskId, { status: status, due_date: date }, { new: true });


        if (!tasks) {
            // If no task is found, send an appropriate response
            return res.status(404).json({ message: 'Task not found' });
        }

        // If the task is found, you can perform further operations here
        console.log(tasks);

        // Send the found task as a response or perform other operations
        res.redirect("/home"); // Render the Alltask view with subtasks data

    } catch (error) {
        // Handle any errors that occur during the database operation
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }


    console.log("--------------OUTSIDE /api/UpdateTasks------------------");


});



// SET UPDATED SUB-TASK
app.post('/api/UpdateSubTasks', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/UpdateSubTasks------------------");

    const SubtaskId = req.body.subId; // Assuming req.userId is correctly set by your authentication middleware
    console.log(SubtaskId);

    if (SubtaskId == "None") {
        res.json({ message: 'Select VALID task' });
    }
    else {


        try {
            // Find the document with the taskId
            const subtasks = await Task.findById(SubtaskId);

            if (!subtasks) {
                // If no task is found, send an appropriate response
                return res.status(404).json({ message: 'Task not found' });
            }

            // If the task is found, you can perform further operations here
            console.log(subtasks);

            // Send the found task as a response or perform other operations
            res.render("UpdateSubTask", { subtasks }); // Render the Alltask view with subtasks data

        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }

    }
    console.log("--------------OUTSIDE /api/UpdateTasks------------------");


});


// SET UPDATED SUB-TASK
app.post('/api/UpdateSubTaskstoMongoDB', authenticateToken, async (req, res) => {

    console.log("--------------INSIDE /api/UpdateTaskstoMongoDB------------------");

    const taskId = req.query.id;
    const status = req.body.status;
    const date = req.body.due_date;
    console.log(taskId);
    try {
        // Find the document with the taskId
        const tasks = await Task.findByIdAndUpdate(taskId, { status: status, due_date: date }, { new: true });


        if (!tasks) {
            // If no task is found, send an appropriate response
            return res.status(404).json({ message: 'Task not found' });
        }

        // If the task is found, you can perform further operations here
        console.log(tasks);

        // Send the found task as a response or perform other operations
        res.redirect("/home"); // Render the Alltask view with subtasks data

    } catch (error) {
        // Handle any errors that occur during the database operation
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }


    console.log("--------------OUTSIDE /api/UpdateTasks------------------");


});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
