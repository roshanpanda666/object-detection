import ObjectDetection from '@/components/object-detection'
import React from 'react'

const page = () => {
  return (
    <div>
      <div className='flex justify-center items-center min-h-screen flex-col'>
        <div className='text-3xl lg:text-6xl font-mono'>
        Thief detection alarm
        </div>
        <div>
          <ObjectDetection></ObjectDetection>
        </div>
        
      </div>
    </div>
  )
}

export default page
