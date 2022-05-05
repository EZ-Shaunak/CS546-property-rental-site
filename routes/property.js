const express = require("express");
const router = express.Router();
const propertyData = require("../data/properties");
const xss = require("xss");
const validations = require("../validation/validations");
const userData = require("../data/users");

async function getAllProperties(req, res) {
  try {
    let properties = await propertyData.getAllProperties();

    res.status(200).json(properties);
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function createProperty(req, res) {
  try {
    req.body;
    //check inputs here

    var images = [];

    req.body.images.forEach(x => {
      images.push(xss(x));
    });

    let centralA = xss(req.body.centralAir);
    let petF = xss(req.body.petFriendly);
    let partyF = xss(req.body.partyFriendly);
    let garage = xss(req.body.garrage);

    let createdProperty = await propertyData.createProperty(
      xss(req.body.name),
      xss(req.body.address),
      xss(req.body.pincode),
      xss(req.body.city),
      xss(req.body.state),
      xss(req.body.type),
      xss(req.body.beds),
      xss(req.body.bath),
      xss(req.body.balcony),
      centralA === "Y" ? true : false,
      petF === "Y" ? true : false,
      partyF === "Y" ? true : false,
      garage === "Y" ? true : false,
      xss(req.body.nearBySchools),
      xss(req.body.nearByMedical),
      xss(req.body.nearByCommute),
      xss(req.body.rent),
      xss(req.body.brokerage),
      xss(req.body.deposit),
      xss(req.body.minimumLeasePeriod),
      images,
      xss(req.body.broker)
    );

    let addPropertyToBroker = await userData.addPropertyAsOwnedByBroker(
      createdProperty.Property.broker,
      createdProperty.Property._id.toString()
    );

    res.status(200).json({ status: true });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function updateProperty(req, res) {
  try {
    //check inputs here

    var images = [];

    req.body.images.forEach(x => {
      images.push(xss(x));
    });

    let centralA = xss(req.body.centralAir);
    let petF = xss(req.body.petFriendly);
    let partyF = xss(req.body.partyFriendly);
    let garage = xss(req.body.garrage);

    let updatedProperty = await propertyData.updateProperty(
      xss(req.params.id),
      xss(req.body.name),
      xss(req.body.address),
      xss(req.body.pincode),
      xss(req.body.city),
      xss(req.body.state),
      xss(req.body.type),
      xss(req.body.beds),
      xss(req.body.bath),
      xss(req.body.balcony),
      centralA === "Y" ? true : false,
      petF === "Y" ? true : false,
      partyF === "Y" ? true : false,
      garage === "Y" ? true : false,
      xss(req.body.nearBySchools),
      xss(req.body.nearByMedical),
      xss(req.body.nearByCommute),
      xss(req.body.rent),
      xss(req.body.brokerage),
      xss(req.body.deposit),
      xss(req.body.minimumLeasePeriod),
      images,
      xss(req.body.broker)
    );

    res.status(200).json({ status: true });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function removeProperty(req, res) {
  try {
    //check inputs here

    let isRemoved = await propertyData.removeProperty(xss(req.body.name));

    let removeOwnedFromBroker = await userData.addPropertyAsOwnedByBroker(
      isRemoved.broker,
      isRemoved.propertyId
    );

    res.status(200).json({ status: true });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function getProperty(req, res) {
  try {
    //check inputs here

    let property = await propertyData.getPropertyById(xss(req.params.id));

    res.status(200).json(property);
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function bookmarkProp(req, res) {
  try {
    var studentemail = validations.validateEmail(xss(req.body.username));
    var propertyId = validations.validatePropertyId(xss(req.body.propertyId));

    let bookmarkedProp = await userData.bookmarkProperty(
      studentemail,
      propertyId
    );

    res.status(200).json({ status: true });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function showInterestInProperty(req, res) {
  try {
    var studentemail = validations.validateEmail(xss(req.body.username));
    var brokeremail = validations.validateEmail(xss(req.body.broker));
    var propertyId = validations.validatePropertyId(xss(req.body.propertyId));

    let interestedProperty = await userData.showInterestInProperty(
      studentemail,
      brokeremail,
      propertyId
    );

    res.status(200).json({ status: true });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

async function markPropertyAsRentedOut(req, res) {
  try {
    var brokeremail = validations.validateEmail(xss(req.body.username));
    var propertyId = validations.validatePropertyId(xss(req.body.propertyId));

    let rentedOutProp = await propertyData.markAsRentedOut(
      brokeremail,
      propertyId
    );

    res.status(200).json({ status: rentedOutProp });
  } catch (e) {
    res.status(400).json({ errorMessage: e });
  }
}

router.route("/getAllProperties").get((req, res) => getAllProperties(req, res));

router.route("/createProperty").post((req, res) => createProperty(req, res));

router.route("/updateProperty/:id").put((req, res) => updateProperty(req, res));

router.route("/removeProperty").put((req, res) => removeProperty(req, res));

router.route("/getProperty/:id").get((req, res) => getProperty(req, res));

router.route("/bookmark").post((req, res) => bookmarkProp(req, res));

router.route("/showInterestInProperty").post((req, res) => showInterestInProperty(req, res));

router.route("/markPropertyAsRentedOut").post((req, res) => markPropertyAsRentedOut(req, res));

module.exports = router;