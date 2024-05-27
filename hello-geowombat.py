import pathlib
import geowombat as gw
import matplotlib.pyplot as plt


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


input_folder = '/mnt/d/MOSAIC'
input_files = files_from_folder(input_folder)


def gwOpenn(files):
    with gw.open(
          files
        , chuck=1024
        , bounds_by='union'
        , mosaic=True
    ) as src:
        print(src)
        nodata_value=0
        src.gw.to_raster('/mnt/d/MOSAIC/output.tif'
                    , compressor='LZW'
                    , bigtiff='YES'
                    , n_works=4
                    , nodata=nodata_value
                    )
        



if __name__ == '__main__':
    gwOpenn(input_files)


    
