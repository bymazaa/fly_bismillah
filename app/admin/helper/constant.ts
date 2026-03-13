export const PACKAGE_LIMITS = {
  TITLE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 100,
  },
  PRICE: {
    MIN: 1,
  },
  DESCRIPTION: {  
    MIN_LENGTH: 50,
    MAX_LENGTH: 3000,
  },
  INCLUDED_ITEMS: {
    MIN_COUNT: 1,
    MAX_COUNT: 15,
  },
};

export const DESTINATIONS_LIMITS = {
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  DESCRIPTION: {
    MIN_LENGTH: 50,
    MAX_LENGTH: 2000,
  },
  ATTRACTIONS: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
  },
  COUNTRY:{
    MIN_LENGTH: 2,
    MAX_LENGTH: 56,
  },
  CURRENCY:{
    MIN_LENGTH: 2,
    MAX_LENGTH: 10,
  },
  BEST_TIME:{
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  REVIEWS:{
    MIN:0,
    MAX:1000000,
  },
  RATING:{
    MIN:0,
    MAX:5,
  },
  
};

export const OFFERS_LIMITS = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  DISCOUNT_PERCENTAGE: {
    MIN: 5,
    MAX: 90,
  },
  DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 1000,
  },
};
