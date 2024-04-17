import pprint
import pathlib
import rasterio
from rasterio.plot import show
from rasterio.merge import merge
import geopandas as gpd

DIR = '/mnt/d'
INPUT_FOLDERS = []
INPUT_FOLDERS.append('available/MAPBIOMAS-FIRE-MATAATLANTICA/mapbiomas-brazil-collection-20-mataatlantica-2020')

if __name__ == '__main__':
    for INPUT_FOLDER in INPUT_FOLDERS:
        path = DIR + '/' + INPUT_FOLDER
        dirr = pathlib.Path(path)
        files = [str(file) for file in dirr.iterdir()]

        pprint.pprint(files)

        rasters = []


        files = [file for file in files if file[-3:] == 'tif']
        for file in files:       
            raster = rasterio.open(file)
        
            pprint.pprint(raster.count)
            pprint.pprint('({},{})'.format(raster.height, raster.width))
            pprint.pprint(raster.bounds)
            pprint.pprint(raster.transform)
            pprint.pprint(raster.crs)
            pprint.pprint('+++')
        
            rasters.append(raster)

        arr, trans = merge(rasters)
        arr = arr.squeeze()

        raster = rasterio.open(
              path + '/' +'mosaic.tif'
            , 'w'
            , driver='GTiff'
            , height=arr.shape[0]
            , width=arr.shape[1]
            , count=1
            , dtype=arr.dtype
            , crs='EPSG:4326'
            , transform=trans
            , compress='LZW'
        )
        raster.write(arr, 1)
        raster.close()
