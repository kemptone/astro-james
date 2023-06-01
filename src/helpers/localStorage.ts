function localStorageWrap(KEY: string) {
  const hasLS = typeof window !== "undefined" && window.localStorage;

  function persist(key: string, s: any) {
    const state = getState();
    let save;

    // s.__time = (new Date()).getTime()

    state[key] = s;

    try {
      save = JSON.stringify(state);
      localStorage.setItem(KEY, save);
    } catch (e) {
      console.error(e);
    }

    return s;
  }

  function populate(key: string) {
    return getState()[key];

    // timelimit = timelimit || Infinity

    // var state = getState()[key]
    //   , now = (new Date()).getTime()

    // if (state && state.__time > now - timelimit)
    //   return state
  }

  function getState() {
    let state;

    try {
      state = JSON.parse(localStorage.getItem(KEY) || "{}");

      if (!state) {
        localStorage.setItem(KEY, "{}");
      }
    } catch (e) {
      console.error(e);
    }

    return state || {};
  }

  if (hasLS) {
    return {
      persist: persist,
      populate: populate,
      getState: getState,
    };
  } else {
    return {
      persist: function (a: string, b: any) {
        return b;
      },
      populate: function () {
        return {};
      },
      getState: function () {
        return {};
      },
    };
  }
}

const james = localStorageWrap("JAMES");

const persist = localStorageWrap.persist = james.persist;
const populate = localStorageWrap.populate = james.populate;
const getState = localStorageWrap.getState = james.getState;

export { getState, localStorageWrap as default, persist, populate };
