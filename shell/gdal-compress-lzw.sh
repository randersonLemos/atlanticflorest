#!/bin/bash

# Check if a directory argument was provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <target-directory>"
    return
fi

# Assign the directory to a variable
target_directory=$1

# Check if the directory exists
if [ ! -d "$target_directory" ]; then
    echo "Directory does not exist: $target_directory"
    return
fi

# Loop through all .tif files in the specified directory
for file in "$target_directory"/*.tif
do
    # Define the full path for the temporary file
    temp_file="${file%.tif}_temp.tif"

    # Apply gdal_translate to compress the file and output to a temporary file
    gdal_translate -of GTiff -co "COMPRESS=LZW" "$file" "$temp_file"

    # Move the temporary file to the original file, overwriting it
    mv "$temp_file" "$file"

    echo "Compressed and replaced $file"
done

return
