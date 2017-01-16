// @Integer(value=255) thrHoles
// @Integer(label="Radius of median filter") radius
// @ImagePlus img


setBatchMode(true);
width=getWidth();
height=getHeight();
nslice=nSlices();
title=getTitle();

run("Duplicate...", "duplicate range="+1+"-"+nslice+" title=temp1");
selectWindow("temp1");
run("Macro...", "code=v=-v+255 stack"); //invert intnsity
run("Median...", "radius="+radius+" stack");
run("Macro...", "code=[if (v<"+thr+") v=0] stack");
run("Macro...", "code=[if (v>="+thr+") v=255] stack");
//run("Minimum...", "radius=15 stack");
//run("Maximum...", "radius=15 stack");
run("Enhance Contrast...", "saturated=0 normalize process_all");
rename("holes_"+title);
run("Merge Channels...", "c1=temp1 c4=title create keep");
run("Stack to RGB", "slices");
rename("holesRGB_"+title);
setBatchMode("exit and display");