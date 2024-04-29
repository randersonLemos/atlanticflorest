import pathlib                                                                                                        
import geowombat as gw                                                                                                
import geopandas as gpd
import matplotlib.pyplot as plt  


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


raster_folder = '/mnt/d/mapbiomas-lulc/MAPBIOMAS-LULC-MATAATLANTICA'
raster_files = files_from_folder(raster_folder)

shape_file = '/mnt/d/mapbiomas-feat/MAPBIOMAS-FEAT-BRAZIL/brazil.shp'

fig, ax = plt.subplots(dpi=200)

shapeNames = {
      'amazonia' : 'Amaz?nia'
    , 'caatinga' : 'Caatinga'
    , 'cerrado'  : 'Cerrado'
    , 'mataatlantica' : 'Mata Atl?ntica'
    , 'pampa' : 'Pampa'
    , 'pantanal' : 'Pantanal'
}


def gwOpenn(files):
    with gw.open(
          files
        , chuck=1024
        , bounds_by='union'
    ) as src:
        print(src)
    

def gwClip(files, geometry):
    with gw.open(
          files
        , chuck=1024
        , bound_by='union'
    ) as src:
        print(src)
        
        cli = src.gw.clip(geometry)
        
        print(cli)

        cli.gw.to_raster(  '/mnt/d/mapbiomas-lulc/MAPBIOMAS-LULC-MATAATLANTICA/output.tif'
                         , compressor='LZW'
                         , bigtiff='YES'
                         , n_works=4
                         )
        


def main():
    raster_file = raster_files[-1]
    
    shape = gpd.read_file(shape_file)
    shape = shape[ shape['NAME_PT_BR'] == shapeNames['mataatlantica'] ]
    

    gwClip(
          raster_file
        , shape.geometry
    )
              

if __name__ == '__main__':
    main()
    

