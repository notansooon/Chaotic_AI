import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { marketApi } from "../api";


/* explore states */

export interface marketStateTypes {
    claimedBy: Record<string, string>;

  

};

const marketInitalState: marketStateTypes = {
    claimedBy: {},
  
}


export const marketSlice = createSlice({
  name: "marketState",
  initialState: marketInitalState,
  reducers: {


    
  }
});

export const {  } = marketSlice.actions;
export default marketSlice.reducer;