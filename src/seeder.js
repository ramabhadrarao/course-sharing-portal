// src/seeder.js
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Course from './models/Course.js';
import Quiz from './models/Quiz.js';
import logger from './utils/logger.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college_course_portal');

// Sample users data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'faculty@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'John Smith',
    email: 'student@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Bob Davis',
    email: 'bob.davis@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/2182968/pexels-photo-2182968.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Carol Brown',
    email: 'carol.brown@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  }
];

// Hash passwords
const hashPasswords = async (users) => {
  const salt = await bcrypt.genSalt(10);
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, salt)
    }))
  );
};

// Sample courses data (will be populated with user IDs after users are created)
const createCoursesData = (facultyUsers) => [
  {
    title: 'Introduction to Computer Science',
    description: 'A comprehensive introduction to computer science fundamentals, programming concepts, and problem-solving techniques. Perfect for beginners.',
    accessCode: 'CS101A',
    coverImage: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[0]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Getting Started',
        order: 1,
        subsections: [
          {
            title: 'Welcome to Computer Science',
            content: '<h2>Welcome to Computer Science!</h2><p>Computer science is the study of computational systems, algorithms, and the design of computing systems and their applications. In this course, you will learn:</p><ul><li>Programming fundamentals</li><li>Problem-solving techniques</li><li>Data structures and algorithms</li><li>Software development practices</li></ul><p>Get ready for an exciting journey into the world of computing!</p>',
            contentType: 'text',
            order: 1
          },
          {
            title: 'Course Overview Video',
            content: 'An introductory video explaining what you will learn in this course.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/embed/QdVFvsCWXrA',
            order: 2
          }
        ]
      },
      {
        title: 'Programming Fundamentals',
        order: 2,
        subsections: [
          {
            title: 'Variables and Data Types',
            content: '<h2>Variables and Data Types</h2><p>Variables are containers for storing data values. In programming, we use different data types to represent different kinds of information:</p><h3>Basic Data Types:</h3><ul><li><strong>Integer:</strong> Whole numbers (e.g., 1, 2, 100)</li><li><strong>Float:</strong> Decimal numbers (e.g., 3.14, 2.5)</li><li><strong>String:</strong> Text (e.g., "Hello World")</li><li><strong>Boolean:</strong> True or False values</li></ul><h3>Example in Python:</h3><pre><code>name = "Alice"  # String\nage = 25        # Integer\nheight = 5.6    # Float\nis_student = True  # Boolean</code></pre>',
            contentType: 'text',
            order: 1
          },
          {
            title: 'Control Structures',
            content: '<h2>Control Structures</h2><p>Control structures allow you to control the flow of your program execution.</p><h3>Conditional Statements:</h3><pre><code>if age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")</code></pre><h3>Loops:</h3><pre><code># For loop\nfor i in range(5):\n    print(i)\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1</code></pre>',
            contentType: 'text',
            order: 2
          }
        ]
      }
    ]
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Learn the basics of web development including HTML, CSS, and JavaScript. Build your first interactive websites and web applications.',
    accessCode: 'WEB101',
    coverImage: 'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[1]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'HTML Basics',
        order: 1,
        subsections: [
          {
            title: 'Introduction to HTML',
            content: '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage using elements and tags.</p><h3>Basic HTML Structure:</h3><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n&lt;head&gt;\n    &lt;title&gt;My First Webpage&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n    &lt;h1&gt;Welcome to My Website&lt;/h1&gt;\n    &lt;p&gt;This is my first paragraph.&lt;/p&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>',
            contentType: 'text',
            order: 1
          },
          {
            title: 'HTML Elements and Tags',
            content: '<h2>Common HTML Elements</h2><p>HTML uses tags to define elements. Here are some common ones:</p><h3>Text Elements:</h3><ul><li><code>&lt;h1&gt; to &lt;h6&gt;</code> - Headings</li><li><code>&lt;p&gt;</code> - Paragraphs</li><li><code>&lt;strong&gt;</code> - Bold text</li><li><code>&lt;em&gt;</code> - Italic text</li></ul><h3>List Elements:</h3><ul><li><code>&lt;ul&gt;</code> - Unordered list</li><li><code>&lt;ol&gt;</code> - Ordered list</li><li><code>&lt;li&gt;</code> - List items</li></ul><h3>Link and Image Elements:</h3><ul><li><code>&lt;a href="url"&gt;</code> - Links</li><li><code>&lt;img src="image.jpg" alt="description"&gt;</code> - Images</li></ul>',
            contentType: 'text',
            order: 2
          }
        ]
      },
      {
        title: 'CSS Styling',
        order: 2,
        subsections: [
          {
            title: 'Introduction to CSS',
            content: '<h2>What is CSS?</h2><p>CSS (Cascading Style Sheets) is used to style and layout web pages. It controls the visual appearance of HTML elements.</p><h3>CSS Syntax:</h3><pre><code>selector {\n    property: value;\n    property: value;\n}</code></pre><h3>Example:</h3><pre><code>h1 {\n    color: blue;\n    font-size: 24px;\n    text-align: center;\n}\n\np {\n    color: #333;\n    line-height: 1.6;\n}</code></pre>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Data Structures and Algorithms',
    description: 'Master fundamental data structures and algorithms essential for efficient programming and problem-solving in computer science.',
    accessCode: 'DSA201',
    coverImage: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[0]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Introduction to Data Structures',
        order: 1,
        subsections: [
          {
            title: 'What are Data Structures?',
            content: '<h2>Data Structures</h2><p>Data structures are ways of organizing and storing data so that they can be accessed and worked with efficiently. They define the relationship between the data and the operations that can be performed on the data.</p><h3>Why are Data Structures Important?</h3><ul><li>Efficient data organization</li><li>Faster data access and manipulation</li><li>Memory optimization</li><li>Better algorithm performance</li></ul><h3>Common Data Structures:</h3><ul><li>Arrays</li><li>Linked Lists</li><li>Stacks</li><li>Queues</li><li>Trees</li><li>Graphs</li><li>Hash Tables</li></ul>',
            contentType: 'text',
            order: 1
          }
        ]
      },
      {
        title: 'Arrays and Lists',
        order: 2,
        subsections: [
          {
            title: 'Understanding Arrays',
            content: '<h2>Arrays</h2><p>An array is a collection of elements stored at contiguous memory locations. Elements can be accessed using their index.</p><h3>Array Characteristics:</h3><ul><li>Fixed size (in most programming languages)</li><li>Elements of the same data type</li><li>Random access using index</li><li>Zero-based indexing</li></ul><h3>Example in Python:</h3><pre><code># Creating an array\nnumbers = [1, 2, 3, 4, 5]\n\n# Accessing elements\nfirst_element = numbers[0]  # Returns 1\nlast_element = numbers[-1]  # Returns 5\n\n# Modifying elements\nnumbers[0] = 10  # Changes first element to 10</code></pre>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Database Management Systems',
    description: 'Learn database design, SQL, and database management concepts. Understand relational databases and modern NoSQL solutions.',
    accessCode: 'DB301',
    coverImage: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[2]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Database Fundamentals',
        order: 1,
        subsections: [
          {
            title: 'Introduction to Databases',
            content: '<h2>What is a Database?</h2><p>A database is a structured collection of data that is stored and accessed electronically. Database Management Systems (DBMS) are software systems that enable users to define, create, maintain, and control access to the database.</p><h3>Types of Databases:</h3><ul><li><strong>Relational Databases:</strong> MySQL, PostgreSQL, Oracle</li><li><strong>NoSQL Databases:</strong> MongoDB, Cassandra, Redis</li><li><strong>Graph Databases:</strong> Neo4j, Amazon Neptune</li><li><strong>Document Databases:</strong> MongoDB, CouchDB</li></ul><h3>Key Concepts:</h3><ul><li>Tables, Rows, and Columns</li><li>Primary and Foreign Keys</li><li>Relationships</li><li>Normalization</li><li>ACID Properties</li></ul>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Machine Learning Basics',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications. Learn to build your first ML models.',
    accessCode: 'ML401',
    coverImage: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[2]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Introduction to Machine Learning',
        order: 1,
        subsections: [
          {
            title: 'What is Machine Learning?',
            content: '<h2>Machine Learning Overview</h2><p>Machine Learning (ML) is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.</p><h3>Types of Machine Learning:</h3><ul><li><strong>Supervised Learning:</strong> Learning with labeled data (e.g., classification, regression)</li><li><strong>Unsupervised Learning:</strong> Finding patterns in unlabeled data (e.g., clustering, dimensionality reduction)</li><li><strong>Reinforcement Learning:</strong> Learning through interaction and feedback</li></ul><h3>Common Applications:</h3><ul><li>Image recognition</li><li>Natural language processing</li><li>Recommendation systems</li><li>Fraud detection</li><li>Autonomous vehicles</li></ul>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  }
];

// Sample quizzes data
const createQuizzesData = (courses) => [
  {
    title: 'Programming Fundamentals Quiz',
    course: courses[0]._id, // Computer Science course
    questions: [
      {
        text: 'Which of the following is a primitive data type in most programming languages?',
        options: [
          { text: 'Array', isCorrect: false },
          { text: 'Integer', isCorrect: true },
          { text: 'Object', isCorrect: false },
          { text: 'Function', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'What does the following code output? console.log(5 + "3")',
        options: [
          { text: '8', isCorrect: false },
          { text: '53', isCorrect: true },
          { text: 'Error', isCorrect: false },
          { text: '15', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are characteristics of variables? (Select all that apply)',
        options: [
          { text: 'Store data values', isCorrect: true },
          { text: 'Have a data type', isCorrect: true },
          { text: 'Cannot be changed', isCorrect: false },
          { text: 'Must be declared before use', isCorrect: true }
        ],
        type: 'multiple'
      }
    ],
    timeLimit: 15
  },
  {
    title: 'HTML Basics Quiz',
    course: courses[1]._id, // Web Development course
    questions: [
      {
        text: 'What does HTML stand for?',
        options: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'HyperText Modern Language', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which HTML tag is used for the largest heading?',
        options: [
          { text: '<h6>', isCorrect: false },
          { text: '<h1>', isCorrect: true },
          { text: '<heading>', isCorrect: false },
          { text: '<h0>', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 10
  },
  {
    title: 'Data Structures Fundamentals',
    course: courses[2]._id, // Data Structures course
    questions: [
      {
        text: 'What is the time complexity of accessing an element in an array by index?',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(1)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which data structure follows the Last In First Out (LIFO) principle?',
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Array', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Linked List', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 20
  }
];

// Import data into DB
const importData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    console.log('✅ Cleared existing data');

    // Hash passwords and create users
    const hashedUsers = await hashPasswords(users);
    const createdUsers = await User.insertMany(hashedUsers);
    console.log('✅ Users created');

    // Separate faculty and student users
    const facultyUsers = createdUsers.filter(user => user.role === 'faculty');
    const studentUsers = createdUsers.filter(user => user.role === 'student');

    // Create courses with faculty as creators and some enrolled students
    const coursesData = createCoursesData(facultyUsers);
    
    // Add some students to courses
    coursesData[0].enrolledStudents = [studentUsers[0]._id, studentUsers[1]._id, studentUsers[2]._id]; // CS course
    coursesData[1].enrolledStudents = [studentUsers[0]._id, studentUsers[3]._id]; // Web Dev course
    coursesData[2].enrolledStudents = [studentUsers[1]._id, studentUsers[2]._id]; // DSA course
    coursesData[3].enrolledStudents = [studentUsers[0]._id]; // Database course
    coursesData[4].enrolledStudents = [studentUsers[2]._id, studentUsers[3]._id]; // ML course

    const createdCourses = await Course.insertMany(coursesData);
    console.log('✅ Courses created');

    // Create quizzes
    const quizzesData = createQuizzesData(createdCourses);
    await Quiz.insertMany(quizzesData);
    console.log('✅ Quizzes created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users: ${createdUsers.length} (1 admin, ${facultyUsers.length} faculty, ${studentUsers.length} students)`);
    console.log(`📚 Courses: ${createdCourses.length}`);
    console.log(`❓ Quizzes: ${quizzesData.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@example.com / password');
    console.log('Faculty: faculty@example.com / password');
    console.log('Student: student@example.com / password');
    console.log('\nAll accounts use password: "password"');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    console.log('🗑️  Deleting all data...');
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    console.log('✅ Data destroyed');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
  }
};

// Check command line arguments
if (process.argv[2] === '-i') {
  importData().then(() => process.exit());
} else if (process.argv[2] === '-d') {
  deleteData().then(() => process.exit());
} else {
  console.log('🌱 Database Seeder');
  console.log('Usage:');
  console.log('  node src/seeder.js -i   Import seed data');
  console.log('  node src/seeder.js -d   Delete all data');
  process.exit();
}