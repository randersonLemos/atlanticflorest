import pathlib
import geowombat as gw
import matplotlib.pyplot as plt


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


if __name__ == '__main__':
    input_folder = '/mnt/d/available/MAPBIOMAS-FIRE-MATAATLANTICA/mapbiomas-brazil-collection-20-mataatlantica-2020'
    input_files = files_from_folder(input_folder)

    #input_files = [
    #    input_folder + '/' + 'mapbiomas-brazil-collection-20-mataatlantica-2022-0000000000-0000000000.tif'
    #]
    
    
    #rasters = []
    #for file in sorted(input_files):
    #    raster = gw.open(file)
    #    rasters.append(
    #        raster
    #    )

    gwOpen = gw.open(
          input_files
        , stack_dim='band'
        , mosaic=True
    )
    raster = gwOpen.data
    print(raster)

    #for time_index in raster.time:
    #    rasterSel = raster.sel(time=time_index)
    #    print(rasterSel.filename)
    #    print(rasterSel.shape)
    #    print('===')

    gwOpen.close()
