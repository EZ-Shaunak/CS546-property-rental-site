const collections = require("../mongoCollections");
const usersCollection = collections.users;
const bcrypt = require("bcrypt");
const saltRounds = 12;
const { ObjectId } = require("mongodb");
const emailer = require("../autoemailer/autoEmailer");
const validation = require("../validation/validations");
const propertyUtils = require("./properties");


async function login(username, password) {

    username = validation.validateEmail(username);
    password = validation.validatePassword(password);

    var users = await usersCollection();

    var user = await users.findOne({ email: username.toLowerCase(), isActive: true });

    if (user) {
        let match = await bcrypt.compare(password, user.password);

        if (!match)
            throw "Either the username or password is invalid!";

        return user;
        //return user with necessary data -- student data / broker data           
    } else {
        throw "Either the username or password is invalid!";
    }

}

async function createUser(firstName, lastName, email, userType, contact, password) {

    firstName = validation.validateFirstName(firstName);
    lastName = validation.validateLastName(lastName);
    email = validation.validateEmail(email);
    userType = validation.validateUserType(userType);
    contact = validation.validateContact(contact);
    password = validation.validatePassword(password);


    const users = await usersCollection();

    var user = await users.findOne({ email: email.toLowerCase(), isActive: true });

    if (user) {
        throw "User with provided email already exists!";
    }

    let userTypeNum = userType === "Student" ? 1 : 2;

    if (userTypeNum === 1) {
        if (email.split(".").slice(-1)[0] !== "edu")
            throw "A student email address/username must end with a registered '.edu' domain!";
    }

    let newUser = {
        _id: ObjectId(),
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        userType: user,
        contact: contact,
        password: await bcrypt.hash(password, saltRounds),
        bookmarkedProp: [],
        ownedProp: [],
        isActive: true
    }

    const insertInfo = await users.insertOne(newUser);

    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw "Could not add user!";

    var insertedUser = await getUser(newUser.email);
    insertedUser.password = password;

    try {
        emailer.sendAccoutConfirmationEmail(insertedUser);
    } catch (error) {
        console.log(error);
    }
    //return data if needed
}

async function updateUser(firstName, lastName, username, contact) {

    firstName = validation.validateFirstName(firstName);
    lastName = validation.validateLastName(lastName);
    username = validation.validateEmail(username);
    contact = validation.validateContact(contact);

    const users = await usersCollection();

    var user = await users.findOne({ email: username.toLowerCase(), isActive: true });

    if (!user) {
        throw "Invalid user";
    }

    var updatedUser = await users.updateOne({ email: username.toLowerCase() }, {
        $set: {
            firstName: firstName,
            lastName: lastName,
            contact: contact
        }
    });

    if (updatedUser.modifiedCount > 0) {
        //update successful
    } else {
        throw "Could not update!";
    }

}

async function removeUser(username) {

    username = validation.validateEmail(username);

    const users = await usersCollection();

    var user = await users.findOne({ email: username.toLowerCase(), isActive: true });

    if (!user) {
        throw "Invalid user";
    }

    var updatedUser = await users.updateOne({ email: username.toLowerCase() }, {
        $set: {
            isActive: false
        }
    });

    if (updatedUser.modifiedCount > 0) {
        //removed successful
    } else {
        throw "Could not update!";
    }

}

async function getUser(username) {

    username = validation.validateEmail(username);

    const users = await usersCollection();

    var user = await users.findOne({ email: username.toLowerCase(), isActive: true });

    if (!user)
        throw "User not found!"

    var userObj = user;
    if (user.userType == 1) {

        var studentBookmarkedProperties = [];

        for (const prop of user.bookmarkedProp) {
            var propFromDb = await propertyUtils.getPropertyById(prop);
            studentBookmarkedProperties.push(propFromDb);
        }

        userObj.bookmarkedPropertyDetails = studentBookmarkedProperties;
    } else {
        var brokerOwnedProperties = [];

        for (const prop of user.ownedProp) {
            var propFromDb = await propertyUtils.getPropertyById(prop);
            brokerOwnedProperties.push(propFromDb);
        }

        userObj.brokerOwnedPropertyDetails = brokerOwnedProperties;
    }

    return userObj;
}


//call this while student clicks bookmark/remove from property
async function bookmarkProperty(studentEmail, propertyId) {
    studentEmail = validation.validateEmail(studentEmail);
    propertyId = validation.validatePropertyId(propertyId);

    const users = await usersCollection();

    var user = await users.findOne({ email: studentEmail.toLowerCase(), isActive: true });

    if (!user) {
        throw "Invalid user";
    }

    var bookMarkOperation = {
        $addToSet: {
            bookmarkedProp: propertyId
        }
    };

    if (user.bookmarkedProp.includes(propertyId)) {
        bookMarkOperation = {
            $pull: {
                bookmarkedProp: propertyId
            }
        };
    }

    var updatedUser = await users.updateOne({ email: studentEmail.toLowerCase() }, bookMarkOperation);

    if (updatedUser.modifiedCount > 0) {
        return true;
    } else {
        throw "Could not update!";
    }
}

//call this while broker adds new property
async function addPropertyAsOwnedByBroker(brokerEmail, propertyId) {
    //check inputs
    brokerEmail = validation.validateEmail(brokerEmail);
    propertyId = validation.validatePropertyId(propertyId);

    const users = await usersCollection();

    var user = await users.findOne({ email: brokerEmail.toLowerCase(), isActive: true });

    if (!user) {
        throw "Invalid user";
    }

    var addToOwnedOperation = {
        $addToSet: {
            ownedProp: propertyId
        }
    };

    if (user.ownedProp.includes(propertyId)) {
        addToOwnedOperation = {
            $pull: {
                ownedProp: propertyId
            }
        };
    }

    var updatedUser = await users.updateOne({ email: brokerEmail.toLowerCase() }, addToOwnedOperation);

    if (updatedUser.modifiedCount > 0) {
        return true;
    } else {
        throw "Could not update!";
    }
}


module.exports = {
    login,
    createUser,
    updateUser,
    removeUser,
    getUser,
    bookmarkProperty,
    addPropertyAsOwnedByBroker

}
