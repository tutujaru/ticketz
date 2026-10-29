import checkoutFormModel from "./checkoutFormModel";
const {
  formField: {
    firstName,
    lastName,
    address1,
    city,
    state,
    zipcode,
    country,
    useAddressForPaymentDetails,
    nameOnCard,
    cardNumber,
    invoiceId,
    cvv
  }
} = checkoutFormModel;

const formInitialValues = {
  [firstName.name]: "",
  [lastName.name]: "",
  [address1.name]: "",
  [city.name]: "",
  [state.name]: "",
  [zipcode.name]: "",
  [country.name]: "",
  [useAddressForPaymentDetails.name]: false,
  [nameOnCard.name]: "",
  [cardNumber.name]: "",
  [invoiceId.name]: "",
  [cvv.name]: ""
};

export default formInitialValues;
